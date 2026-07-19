import { createHmac } from 'crypto';

const AUTH_REPO = 'EstaTea/fsl-auth';
const GH_API    = 'https://api.github.com';

function ghHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'fsl-auth-proxy',
  };
}

async function readJson(token, path) {
  const r = await fetch(`${GH_API}/repos/${AUTH_REPO}/contents/${path}`, { headers: ghHeaders(token) });
  if (!r.ok) return { data: null, sha: null };
  const d = await r.json();
  const data = JSON.parse(Buffer.from(d.content.replace(/\n/g, ''), 'base64').toString('utf8'));
  return { data, sha: d.sha };
}

async function writeJson(token, path, sha, data, message) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = { message, content };
  if (sha) body.sha = sha;
  const r = await fetch(`${GH_API}/repos/${AUTH_REPO}/contents/${path}`, {
    method: 'PUT', headers: ghHeaders(token), body: JSON.stringify(body),
  });
  return r.ok;
}

// 验证 JWT token
function verifyToken(tokenStr, secret) {
  try {
    const [header, payload, sig] = tokenStr.split('.');
    const expectedSig = createHmac('sha256', secret)
      .update(`${header}.${payload}`).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    if (sig !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ghToken    = process.env.GH_TOKEN;
  const authSecret = process.env.AUTH_SECRET;
  if (!ghToken || !authSecret) return res.status(500).json({ error: 'Server misconfigured' });

  // 验证管理员身份：支持 JWT（邮箱登录）和 GitHub token（仓库 owner）
  const authHeader = req.headers['authorization'] || '';
  const rawToken = authHeader.replace('Bearer ', '').trim();

  let isAdmin = false;

  if (rawToken.startsWith('gh:')) {
    // GitHub token 验证：检查是否为仓库 owner
    const ghPat = rawToken.slice(3);
    try {
      const r = await fetch(`${GH_API}/repos/${AUTH_REPO}`, {
        headers: { ...ghHeaders(ghPat), 'Authorization': `Bearer ${ghPat}` },
      });
      if (r.ok) {
        const repo = await r.json();
        isAdmin = repo.permissions?.admin === true;
      }
    } catch {}
  } else {
    // JWT 验证
    const claims = verifyToken(rawToken, authSecret);
    isAdmin = !!claims?.is_admin;
  }

  if (!isAdmin) {
    return res.status(403).json({ error: '无权限：需要管理员身份' });
  }

  const action = req.query.action;

  // ── GET 列表 / 配置 ───────────────────────────────────────────────
  if (req.method === 'GET') {
    if (action === 'config') {
      const { data } = await readJson(ghToken, 'config.json');
      return res.status(200).json({ ok: true, config: data });
    }
    // 默认返回用户列表（隐藏密码字段）
    const { data } = await readJson(ghToken, 'users.json');
    if (!data) return res.status(500).json({ error: '无法读取用户数据' });
    const safeUsers = data.users.map(({ password_hash, salt, ...rest }) => rest);
    return res.status(200).json({ ok: true, users: safeUsers });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  // ── 审批 / 拒绝 / 禁用 / 启用用户 ──────────────────────────────
  if (action === 'approve' || action === 'reject' || action === 'disable' || action === 'enable') {
    const { user_id } = body || {};
    if (!user_id) return res.status(400).json({ error: '缺少 user_id' });

    const { data: usersData, sha: usersSha } = await readJson(ghToken, 'users.json');
    if (!usersData) return res.status(500).json({ error: '无法读取用户数据' });

    const user = usersData.users.find(u => u.id === user_id);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const statusMap = { approve: 'active', reject: 'rejected', disable: 'disabled', enable: 'active' };
    user.status = statusMap[action];
    if (action === 'approve') user.approved_at = new Date().toISOString();

    const ok = await writeJson(ghToken, 'users.json', usersSha, usersData, `auth: ${action} 用户 ${user.email}`);
    return res.status(ok ? 200 : 500).json({ ok, status: user.status });
  }

  // ── 更新配置 ────────────────────────────────────────────────────
  if (action === 'update-config') {
    const { auto_approve, allowed_email_domains, admin_users } = body || {};
    const { data: config, sha: configSha } = await readJson(ghToken, 'config.json');
    if (!config) return res.status(500).json({ error: '无法读取配置' });

    if (auto_approve !== undefined) config.auto_approve = !!auto_approve;
    if (Array.isArray(allowed_email_domains)) config.allowed_email_domains = allowed_email_domains;
    if (Array.isArray(admin_users)) config.admin_users = admin_users.map(e => e.toLowerCase());

    const ok = await writeJson(ghToken, 'config.json', configSha, config, 'auth: 更新认证配置');
    return res.status(ok ? 200 : 500).json({ ok, config });
  }

  return res.status(400).json({ error: `未知操作: ${action}` });
}

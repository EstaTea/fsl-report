import { createHmac, randomBytes } from 'crypto';

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

function hashPassword(password, salt) {
  return createHmac('sha256', salt).update(password).digest('hex');
}

// 轻量级 JWT：header.payload.sig (HMAC-SHA256, base64url)
function b64url(s) {
  return Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function makeToken(payload, secret) {
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = b64url(JSON.stringify(payload));
  const sig     = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${header}.${body}.${sig}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ghToken    = process.env.GH_TOKEN;
  const authSecret = process.env.AUTH_SECRET;
  if (!ghToken || !authSecret) return res.status(500).json({ error: 'Server misconfigured' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { email, password } = body || {};

  if (!email || !password) {
    return res.status(400).json({ error: '请填写邮箱和密码' });
  }

  const { data: usersData, sha: usersSha } = await readJson(ghToken, 'users.json');
  if (!usersData) return res.status(500).json({ error: '无法读取用户数据' });

  const emailLower = email.toLowerCase();
  const user = usersData.users.find(u => u.email === emailLower);

  if (!user) return res.status(401).json({ error: '邮箱或密码错误' });
  if (user.status === 'pending') return res.status(403).json({ error: '账号待审批，请等待管理员确认后再登录' });
  if (user.status === 'disabled') return res.status(403).json({ error: '账号已被禁用，请联系管理员' });

  const hash = hashPassword(password, user.salt);
  if (hash !== user.password_hash) return res.status(401).json({ error: '邮箱或密码错误' });

  // 更新 last_login（忽略写入失败，不阻断登录）
  user.last_login = new Date().toISOString();
  writeJson(ghToken, 'users.json', usersSha, usersData, `auth: 登录 ${emailLower}`).catch(() => {});

  // 读取 config 判断是否 admin
  const { data: config } = await readJson(ghToken, 'config.json');
  const isAdmin = config?.admin_users?.includes(emailLower) || false;

  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600; // 7天
  const sessionToken = makeToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    is_admin: isAdmin,
    exp,
  }, authSecret);

  return res.status(200).json({
    ok: true,
    token: sessionToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_admin: isAdmin,
    },
  });
}

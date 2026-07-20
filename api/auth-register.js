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
  if (!r.ok) {
    const errBody = await r.json().catch(() => ({}));
    return { ok: false, status: r.status, ghError: errBody.message || JSON.stringify(errBody) };
  }
  return { ok: true };
}

function hashPassword(password, salt) {
  return createHmac('sha256', salt).update(password).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const token = process.env.GH_TOKEN;
  if (!token) return res.status(500).json({ error: 'Server misconfigured' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { email, password, name, role } = body || {};

  if (!email || !password || !name) {
    return res.status(400).json({ error: '缺少必填字段：email、password、name' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '邮箱格式无效' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: '密码至少8位' });
  }

  const [{ data: usersData, sha: usersSha }, { data: config }] = await Promise.all([
    readJson(token, 'users.json'),
    readJson(token, 'config.json'),
  ]);

  if (!usersData) return res.status(500).json({ error: '无法读取用户数据' });

  const emailLower = email.toLowerCase();

  // 检查邮箱域名限制
  if (config?.allowed_email_domains?.length > 0) {
    const domain = emailLower.split('@')[1];
    if (!config.allowed_email_domains.includes(domain)) {
      return res.status(403).json({ error: `不支持该邮箱域名，请使用: ${config.allowed_email_domains.join(', ')}` });
    }
  }

  // 检查是否已注册
  const existing = usersData.users.find(u => u.email === emailLower);
  if (existing) {
    return res.status(409).json({ error: '该邮箱已注册' });
  }

  const salt = randomBytes(16).toString('hex');
  const autoApprove = config?.auto_approve !== false;

  const newUser = {
    id: randomBytes(8).toString('hex'),
    email: emailLower,
    name,
    role: role || 'member',
    password_hash: hashPassword(password, salt),
    salt,
    status: autoApprove ? 'active' : 'pending',
    created_at: new Date().toISOString(),
    approved_at: autoApprove ? new Date().toISOString() : null,
    last_login: null,
  };

  usersData.users.push(newUser);

  const result = await writeJson(token, 'users.json', usersSha, usersData, `auth: 新用户注册 ${emailLower}`);
  if (!result.ok) {
    return res.status(500).json({ error: `写入失败(${result.status}): ${result.ghError}` });
  }

  return res.status(200).json({
    ok: true,
    status: newUser.status,
    message: autoApprove ? '注册成功，可以直接登录' : '注册成功，请等待管理员审批后再登录',
  });
}

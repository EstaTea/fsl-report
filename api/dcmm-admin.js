export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.GH_TOKEN;
  if (!token) return res.status(500).json({ error: 'Missing GH_TOKEN' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch (e) { return res.status(400).json({ error: 'Invalid JSON' }); }

  const GH_API = 'https://api.github.com/repos/EstaTea/fsl-report/contents/kanban/survey-dcmm-data.json';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'fsl-dcmm-proxy',
  };

  // 读取现有数据
  let existing = { submissions: [] }, sha = null;
  try {
    const getR = await fetch(GH_API, { headers });
    if (getR.ok) {
      const gd = await getR.json();
      sha = gd.sha;
      existing = JSON.parse(decodeURIComponent(escape(atob(gd.content.replace(/\n/g, '')))));
    }
  } catch (e) { return res.status(500).json({ error: 'Failed to read data' }); }

  let subs = existing.submissions || [];

  // 用 savedAt 作为唯一标识定位记录
  const { savedAt, entry } = body;
  const idx = subs.findIndex(s => s.savedAt === savedAt);
  if (idx < 0) return res.status(400).json({ error: 'Invalid index' });

  if (req.method === 'DELETE') {
    const deleted = subs[idx];
    subs.splice(idx, 1);
    existing.submissions = subs;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(existing, null, 2))));
    const putR = await fetch(GH_API, {
      method: 'PUT', headers,
      body: JSON.stringify({ message: `dcmm: 删除评估记录 ${deleted.name}`, content, sha })
    });
    if (putR.ok) return res.status(200).json({ ok: true });
    const err = await putR.json();
    return res.status(500).json({ ok: false, error: err.message });
  }

  if (req.method === 'PUT') {
    subs[idx] = { ...subs[idx], ...entry };
    existing.submissions = subs;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(existing, null, 2))));
    const putR = await fetch(GH_API, {
      method: 'PUT', headers,
      body: JSON.stringify({ message: `dcmm: 修改评估记录 ${subs[idx].name}`, content, sha })
    });
    if (putR.ok) return res.status(200).json({ ok: true });
    const err = await putR.json();
    return res.status(500).json({ ok: false, error: err.message });
  }
}

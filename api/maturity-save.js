export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const token = process.env.GH_TOKEN;
  if (!token) return res.status(500).json({ error: 'Missing GH_TOKEN' });

  let entry;
  try { entry = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch (e) { return res.status(400).json({ error: 'Invalid JSON' }); }

  const GH_API = 'https://api.github.com/repos/EstaTea/fsl-report/contents/kanban/survey-maturity-data.json';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'fsl-maturity-proxy',
  };

  let existing = { submissions: [] }, sha = null;
  try {
    const getR = await fetch(GH_API, { headers });
    if (getR.ok) {
      const gd = await getR.json();
      sha = gd.sha;
      existing = JSON.parse(Buffer.from(gd.content.replace(/\n/g, ''), 'base64').toString('utf8'));
    }
  } catch (e) {}

  const subs = existing.submissions || [];
  const idx = subs.findIndex(s => s.id === entry.id ||
    (s.respondent?.name === entry.respondent?.name && s.respondent?.dept === entry.respondent?.dept));
  if (idx >= 0) subs[idx] = entry; else subs.push(entry);
  existing.submissions = subs;

  const content = Buffer.from(JSON.stringify(existing, null, 2)).toString('base64');
  const putBody = { message: `maturity: 提交评估 ${entry.respondent?.name || entry.id}`, content };
  if (sha) putBody.sha = sha;

  const putR = await fetch(GH_API, { method: 'PUT', headers, body: JSON.stringify(putBody) });
  if (putR.ok) return res.status(200).json({ ok: true });
  const err = await putR.json();
  return res.status(500).json({ ok: false, error: err.message });
}

import kv from './_db.js';
import { getUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    const user = await getUser(req);

    if (req.method === 'GET') {
      if (!user) return res.json({ theme: 'dark' });
      const settings = (await kv.get(`settings:${user.id}`)) || {};
      return res.json({ theme: settings.theme || 'dark' });
    }

    if (req.method === 'POST') {
      if (!user) return res.status(401).json({ error: 'Not signed in' });
      const theme = ['light', 'dark', 'system'].includes(req.body.theme)
        ? req.body.theme
        : 'dark';
      await kv.set(`settings:${user.id}`, { theme });
      return res.json({ ok: true, theme });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('settings error', e);
    res.status(500).json({ error: 'Server error' });
  }
}
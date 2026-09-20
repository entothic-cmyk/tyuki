import sql, { init } from './_db.js';
import { getUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    await init();
    const user = await getUser(req);

    if (req.method === 'GET') {
      if (!user) return res.json({ theme: 'dark' });
      const rows = await sql`SELECT theme FROM user_settings WHERE user_id = ${user.id} LIMIT 1`;
      return res.json({ theme: rows[0]?.theme || 'dark' });
    }

    if (req.method === 'POST') {
      if (!user) return res.status(401).json({ error: 'Not signed in' });
      const theme = ['light', 'dark', 'system'].includes(req.body.theme) ? req.body.theme : 'dark';
      await sql`
        INSERT INTO user_settings (user_id, theme) VALUES (${user.id}, ${theme})
        ON CONFLICT (user_id) DO UPDATE SET theme = EXCLUDED.theme
      `;
      return res.json({ ok: true, theme });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('settings error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
}
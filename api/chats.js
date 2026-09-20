import crypto from 'crypto';
import sql, { init } from './_db.js';
import { getUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    await init();
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });

    if (req.method === 'GET') {
      const chats = await sql`
        SELECT id, title, created_at, updated_at
        FROM chats WHERE user_id = ${user.id}
        ORDER BY updated_at DESC
      `;
      return res.json({ chats });
    }

    if (req.method === 'POST') {
      const id = crypto.randomUUID();
      const now = Date.now();
      await sql`
        INSERT INTO chats (id, user_id, title, created_at, updated_at)
        VALUES (${id}, ${user.id}, 'New chat', ${now}, ${now})
      `;
      return res.json({ id, title: 'New chat' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('chats error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
}
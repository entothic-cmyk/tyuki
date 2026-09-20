import sql, { init } from './_db.js';
import { getUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    await init();
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });

    const { id } = req.query;

    if (req.method === 'GET') {
      const chats = await sql`
        SELECT * FROM chats WHERE id = ${id} AND user_id = ${user.id} LIMIT 1
      `;
      if (!chats.length) return res.status(404).json({ error: 'Chat not found' });

      const msgs = await sql`
        SELECT role, content, attachments
        FROM messages WHERE chat_id = ${id}
        ORDER BY id ASC
      `;

      return res.json({
        chat: { id: chats[0].id, title: chats[0].title },
        messages: msgs.map(m => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments ? JSON.parse(m.attachments) : []
        }))
      });
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM messages WHERE chat_id = ${id}`;
      await sql`DELETE FROM chats WHERE id = ${id} AND user_id = ${user.id}`;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('chat id error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
}
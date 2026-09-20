import kv, { removeChatFromUser } from './_db.js';
import { getUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });

    const id = req.query.id;
    const chat = await kv.get(`chat:${id}`);
    if (!chat || chat.user_id !== user.id)
      return res.status(404).json({ error: 'Chat not found' });

    if (req.method === 'GET') {
      const messages = (await kv.get(`messages:${id}`)) || [];
      return res.json({
        chat: { id: chat.id, title: chat.title },
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments || []
        }))
      });
    }

    if (req.method === 'DELETE') {
      await kv.del(`messages:${id}`);
      await kv.del(`chat:${id}`);
      await removeChatFromUser(user.id, id);
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('chat [id] error', e);
    res.status(500).json({ error: 'Server error' });
  }
}
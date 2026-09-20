import crypto from 'crypto';
import kv, {
  addChatToUser,
  getUserChatIds
} from './_db.js';
import { getUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });

    if (req.method === 'GET') {
      const ids = await getUserChatIds(user.id);
      const chats = [];
      for (const id of ids) {
        const chat = await kv.get(`chat:${id}`);
        if (chat) chats.push({
          id: chat.id,
          title: chat.title,
          created_at: chat.created_at,
          updated_at: chat.updated_at
        });
      }
      chats.sort((a, b) => b.updated_at - a.updated_at);
      return res.json({ chats });
    }

    if (req.method === 'POST') {
      const id = crypto.randomUUID();
      const now = Date.now();
      const chat = {
        id,
        user_id: user.id,
        title: 'New chat',
        created_at: now,
        updated_at: now
      };
      await kv.set(`chat:${id}`, chat);
      await kv.set(`messages:${id}`, []);
      await addChatToUser(user.id, id);
      return res.json({ id, title: 'New chat' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('chats error', e);
    res.status(500).json({ error: 'Server error' });
  }
}
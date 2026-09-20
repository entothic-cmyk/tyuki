import kv from './_db.js';
import { getUser } from './_auth.js';

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } }
};

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });

    const { chatId, messages = [], model = 'deepseek-v4.1' } = req.body || {};

    const cleaned = messages.map(m => {
      if (!m.attachments?.length)
        return { role: m.role, content: m.content || '' };
      const names = m.attachments
        .map(a => `${a.name} (${a.type || 'file'}, ${(a.size / 1024).toFixed(1)} KB)`)
        .join(', ');
      return { role: m.role, content: `${m.content || ''}\n[User attached: ${names}]` };
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const upstream = await fetch(`${process.env.BOTLIY_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BOTLIY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ model, messages: cleaned, stream: true })
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error('Upstream error', upstream.status, t);
      res.write(`data: ${JSON.stringify({ error: `Upstream ${upstream.status}` })}\n\n`);
      return res.end();
    }

    const ct = (upstream.headers.get('content-type') || '').toLowerCase();
    const isSSE = ct.includes('text/event-stream');
    let fullReply = '';

    if (isSSE) {
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let cut;
        while ((cut = buf.indexOf('\n\n')) !== -1) {
          const chunk = buf.slice(0, cut);
          buf = buf.slice(cut + 2);

          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullReply += delta;
                res.write(`data: ${JSON.stringify({ delta })}\n\n`);
              }
            } catch {}
          }
        }
      }
    } else {
      const data = await upstream.json();
      fullReply = data?.choices?.[0]?.message?.content || '';
      if (fullReply) res.write(`data: ${JSON.stringify({ delta: fullReply })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    if (chatId && fullReply) {
      const chat = await kv.get(`chat:${chatId}`);
      if (chat && chat.user_id === user.id) {
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        const list = (await kv.get(`messages:${chatId}`)) || [];

        list.push({
          role: 'user',
          content: lastUser?.content || '',
          attachments: lastUser?.attachments || [],
          created_at: Date.now()
        });
        list.push({
          role: 'assistant',
          content: fullReply,
          attachments: null,
          created_at: Date.now()
        });

        await kv.set(`messages:${chatId}`, list);

        let title = chat.title;
        if (!title || title === 'New chat')
          title = (lastUser?.content || 'New chat').slice(0, 40);

        chat.title = title;
        chat.updated_at = Date.now();
        await kv.set(`chat:${chatId}`, chat);
      }
    }
  } catch (e) {
    console.error('chat error', e);
    try {
      res.write(`data: ${JSON.stringify({ error: 'Server error' })}\n\n`);
      res.end();
    } catch {}
  }
}
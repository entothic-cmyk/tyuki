import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const COOKIE = 'bluebex_session';
const newSession = (uid) => {
  const t = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token,user_id,created_at) VALUES (?,?,?)').run(t, uid, Date.now());
  return t;
};
const getUser = (req) => {
  const t = req.cookies?.[COOKIE];
  if (!t) return null;
  return db.prepare('SELECT u.id,u.email,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?').get(t) || null;
};
const auth = (req, res, next) => {
  const u = getUser(req);
  if (!u) return res.status(401).json({ error: 'Not signed in' });
  req.user = u; next();
};

app.post('/api/auth/register', async (req, res) => {
  const { email, name, password } = req.body || {};
  if (!email || !name || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be ≥ 6 chars' });
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
    return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const info = db.prepare('INSERT INTO users (email,name,password_hash,created_at) VALUES (?,?,?,?)')
    .run(email, name, hash, Date.now());
  const uid = Number(info.lastInsertRowid);
  res.cookie(COOKIE, newSession(uid), { httpOnly: true, sameSite: 'lax', maxAge: 2.6e9 });
  res.json({ ok: true, user: { id: uid, email, name } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  res.cookie(COOKIE, newSession(user.id), { httpOnly: true, sameSite: 'lax', maxAge: 2.6e9 });
  res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/logout', (req, res) => {
  const t = req.cookies?.[COOKIE];
  if (t) db.prepare('DELETE FROM sessions WHERE token=?').run(t);
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => res.json({ user: getUser(req) }));

app.get('/api/settings', auth, (req, res) => {
  const s = db.prepare('SELECT theme FROM user_settings WHERE user_id=?').get(req.user.id);
  res.json({ theme: s?.theme || 'dark' });
});

app.post('/api/settings', auth, (req, res) => {
  const theme = ['light', 'dark', 'system'].includes(req.body.theme) ? req.body.theme : 'dark';
  const e = db.prepare('SELECT user_id FROM user_settings WHERE user_id=?').get(req.user.id);
  if (e) db.prepare('UPDATE user_settings SET theme=? WHERE user_id=?').run(theme, req.user.id);
  else db.prepare('INSERT INTO user_settings (user_id,theme) VALUES (?,?)').run(req.user.id, theme);
  res.json({ ok: true, theme });
});

app.get('/api/chats', auth, (req, res) => {
  res.json({
    chats: db.prepare('SELECT id,title,created_at,updated_at FROM chats WHERE user_id=? ORDER BY updated_at DESC').all(req.user.id)
  });
});

app.post('/api/chats', auth, (req, res) => {
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare('INSERT INTO chats (id,user_id,title,created_at,updated_at) VALUES (?,?,?,?,?)')
    .run(id, req.user.id, 'New chat', now, now);
  res.json({ id, title: 'New chat' });
});

app.get('/api/chats/:id', auth, (req, res) => {
  const chat = db.prepare('SELECT * FROM chats WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  const msgs = db.prepare('SELECT role,content,attachments FROM messages WHERE chat_id=? ORDER BY id ASC').all(req.params.id);
  res.json({
    chat: { id: chat.id, title: chat.title },
    messages: msgs.map(m => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments ? JSON.parse(m.attachments) : []
    }))
  });
});

app.delete('/api/chats/:id', auth, (req, res) => {
  db.prepare('DELETE FROM messages WHERE chat_id=?').run(req.params.id);
  db.prepare('DELETE FROM chats WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.post('/api/chat', auth, async (req, res) => {
  try {
    const { chatId, messages = [], model = 'deepseek-v4.1' } = req.body;
    const cleaned = messages.map(m => {
      if (!m.attachments?.length) return { role: m.role, content: m.content || '' };
      const names = m.attachments.map(a => `${a.name} (${a.type || 'file'}, ${(a.size / 1024).toFixed(1)} KB)`).join(', ');
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
      const chat = db.prepare('SELECT id,title FROM chats WHERE id=? AND user_id=?').get(chatId, req.user.id);
      if (chat) {
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        const now = Date.now();
        db.prepare('INSERT INTO messages (chat_id,role,content,attachments,created_at) VALUES (?,?,?,?,?)')
          .run(chatId, 'user', lastUser?.content || '', JSON.stringify(lastUser?.attachments || []), now);
        db.prepare('INSERT INTO messages (chat_id,role,content,attachments,created_at) VALUES (?,?,?,?,?)')
          .run(chatId, 'assistant', fullReply, null, Date.now());
        let title = chat.title;
        if (!title || title === 'New chat') title = (lastUser?.content || 'New chat').slice(0, 40);
        db.prepare('UPDATE chats SET title=?,updated_at=? WHERE id=?').run(title, Date.now(), chatId);
      }
    }
  } catch (e) {
    console.error('Chat error:', e);
    try { res.write(`data: ${JSON.stringify({ error: 'Server error' })}\n\n`); res.end(); } catch {}
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bluebex AI → http://localhost:${PORT}`));
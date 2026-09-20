import bcrypt from 'bcryptjs';
import sql, { init } from './_db.js';
import { newSessionToken, setCookieHeader } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    await init();
    const { email, name, password } = req.body || {};
    if (!email || !name || !password)
      return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length)
      return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const inserted = await sql`
      INSERT INTO users (email, name, password_hash, created_at)
      VALUES (${email}, ${name}, ${hash}, ${Date.now()})
      RETURNING id
    `;

    const userId = inserted[0].id;
    const token = newSessionToken();
    await sql`
      INSERT INTO sessions (token, user_id, created_at)
      VALUES (${token}, ${userId}, ${Date.now()})
    `;

    res.setHeader('Set-Cookie', setCookieHeader(token));
    res.json({ ok: true, user: { id: userId, email, name } });
  } catch (e) {
    console.error('register error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
}
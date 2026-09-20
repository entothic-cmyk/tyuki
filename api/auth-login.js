import bcrypt from 'bcryptjs';
import sql, { init } from './_db.js';
import { newSessionToken, setCookieHeader } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    await init();
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    if (!rows.length)
      return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = newSessionToken();
    await sql`
      INSERT INTO sessions (token, user_id, created_at)
      VALUES (${token}, ${user.id}, ${Date.now()})
    `;

    res.setHeader('Set-Cookie', setCookieHeader(token));
    res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error('login error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
}
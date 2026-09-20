import bcrypt from 'bcryptjs';
import {
  getUserByEmail,
  saveUser,
  nextUserId
} from './_db.js';
import {
  newSessionToken,
  setCookieHeader,
  saveSession
} from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, name, password } = req.body || {};
    if (!email || !name || !password)
      return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await getUserByEmail(email);
    if (existing)
      return res.status(409).json({ error: 'Email already registered' });

    const id = await nextUserId();
    const hash = await bcrypt.hash(password, 10);

    const user = {
      id,
      email,
      name,
      password_hash: hash,
      created_at: Date.now()
    };
    await saveUser(user);

    const token = newSessionToken();
    await saveSession(token, id);

    res.setHeader('Set-Cookie', setCookieHeader(token));
    res.json({ ok: true, user: { id, email, name } });
  } catch (e) {
    console.error('register error', e);
    res.status(500).json({ error: 'Server error' });
  }
}
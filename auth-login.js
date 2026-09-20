import bcrypt from 'bcryptjs';
import { getUserByEmail } from './_db.js';
import {
  newSessionToken,
  setCookieHeader,
  saveSession
} from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await getUserByEmail(email);
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = newSessionToken();
    await saveSession(token, user.id);

    res.setHeader('Set-Cookie', setCookieHeader(token));
    res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error('login error', e);
    res.status(500).json({ error: 'Server error' });
  }
}
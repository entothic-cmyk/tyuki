import { getUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    const user = await getUser(req);
    res.json({ user });
  } catch (e) {
    console.error('me error:', e);
    res.json({ user: null });
  }
}
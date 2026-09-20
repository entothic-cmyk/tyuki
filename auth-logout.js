import {
  parseCookies,
  clearCookieHeader,
  deleteSession
} from './_auth.js';

export default async function handler(req, res) {
  try {
    const cookies = parseCookies(req);
    if (cookies.bluebex_session) {
      await deleteSession(cookies.bluebex_session);
    }
    res.setHeader('Set-Cookie', clearCookieHeader());
    res.json({ ok: true });
  } catch (e) {
    console.error('logout error', e);
    res.json({ ok: true });
  }
}
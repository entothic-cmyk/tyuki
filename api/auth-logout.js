import sql, { init } from './_db.js';
import { parseCookies, clearCookieHeader } from './_auth.js';

export default async function handler(req, res) {
  try {
    await init();
    const cookies = parseCookies(req);
    if (cookies.bluebex_session) {
      await sql`DELETE FROM sessions WHERE token = ${cookies.bluebex_session}`;
    }
    res.setHeader('Set-Cookie', clearCookieHeader());
    res.json({ ok: true });
  } catch (e) {
    console.error('logout error:', e);
    res.json({ ok: true });
  }
}
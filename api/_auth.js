import crypto from 'crypto';
import sql, { init } from './_db.js';

const COOKIE = 'bluebex_session';

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(c => {
    const idx = c.indexOf('=');
    if (idx < 0) return;
    const k = c.slice(0, idx).trim();
    const v = c.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

export function setCookieHeader(token) {
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearCookieHeader() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function getUser(req) {
  await init();
  const cookies = parseCookies(req);
  const token = cookies[COOKIE];
  if (!token) return null;

  const rows = await sql`
    SELECT u.id, u.email, u.name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  return rows[0] || null;
}

export function newSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}
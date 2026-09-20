import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

let initialized = false;

export async function init() {
  if (initialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      title TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      attachments TEXT,
      created_at BIGINT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id BIGINT PRIMARY KEY,
      theme TEXT DEFAULT 'dark'
    )
  `;

  initialized = true;
}

export default sql;
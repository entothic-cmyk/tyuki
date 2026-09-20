import { DatabaseSync } from 'node:sqlite';

const DB_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/bluebex.db`
  : 'bluebex.db';

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password_hash TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS chats (id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,title TEXT NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT,chat_id TEXT NOT NULL,role TEXT NOT NULL,content TEXT NOT NULL,attachments TEXT,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS user_settings (user_id INTEGER PRIMARY KEY,theme TEXT DEFAULT 'dark');
`);
export default db;
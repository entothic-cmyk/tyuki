import { kv } from '@vercel/kv';

export default kv;

export async function nextUserId() {
  return await kv.incr('nextuserid');
}

export async function saveUser(user) {
  await kv.set(`user:${user.email}`, user);
  await kv.set(`userbyid:${user.id}`, user.email);
}

export async function getUserByEmail(email) {
  return await kv.get(`user:${email}`);
}

export async function getUserById(id) {
  const email = await kv.get(`userbyid:${id}`);
  if (!email) return null;
  return await kv.get(`user:${email}`);
}

export async function saveSession(token, userId) {
  await kv.set(`session:${token}`, { user_id: userId, created_at: Date.now() });
}

export async function getSession(token) {
  return await kv.get(`session:${token}`);
}

export async function deleteSession(token) {
  await kv.del(`session:${token}`);
}

export async function addChatToUser(userId, chatId) {
  const key = `userchats:${userId}`;
  const list = (await kv.get(key)) || [];
  list.unshift(chatId);
  await kv.set(key, list);
}

export async function getUserChatIds(userId) {
  return (await kv.get(`userchats:${userId}`)) || [];
}

export async function removeChatFromUser(userId, chatId) {
  const key = `userchats:${userId}`;
  const list = (await kv.get(key)) || [];
  await kv.set(key, list.filter(id => id !== chatId));
}
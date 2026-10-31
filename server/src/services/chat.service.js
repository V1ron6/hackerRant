const { v4: uuidv4 } = require('uuid');
const { QueryTypes, Op } = require('sequelize');
const { sequelize, User, Chat, ChatMember, Message } = require('../models');

const MAX_TEXT  = 4000;
const PAGE_SIZE = 30;

const httpError = (status, message) => Object.assign(new Error(message), { status });

const toMessage = (m) => ({
  id:         m.id,
  chatId:     m.chat_id,
  senderId:   m.sender_id,
  text:       m.text,
  created_at: m.created_at,
});

// Throws 404 (not 403) so chat ids can't be probed by non-members.
exports.assertMember = async (userId, chatId) => {
  const member = await ChatMember.findOne({ where: { chat_id: chatId, user_id: userId } });
  if (!member) throw httpError(404, 'Chat not found');
  return member;
};

const memberIds = async (chatId) =>
  (await ChatMember.findAll({ where: { chat_id: chatId }, attributes: ['user_id'] }))
    .map((m) => m.user_id);
exports.memberIds = memberIds;

// ─── Create (or return the existing) DM with another user ────────────────────
exports.createDm = async (me, username) => {
  const other = await User.findOne({
    where:      { username, status: 'active' },
    attributes: ['id', 'username'],
  });

  if (!other)             throw httpError(404, 'User not found');
  if (other.id === me.id) throw httpError(400, 'You cannot chat with yourself');

  const dmKey = [me.id, other.id].sort().join(':');

  const [chat, createdNow] = await sequelize.transaction(async (t) => {
    const existing = await Chat.findOne({ where: { dm_key: dmKey }, transaction: t });
    if (existing) return [existing, false];

    const chat = await Chat.create({ id: uuidv4(), dm_key: dmKey }, { transaction: t });
    await ChatMember.bulkCreate(
      [me.id, other.id].map((user_id) => ({ chat_id: chat.id, user_id })),
      { transaction: t }
    );
    return [chat, true];
  });

  return { created: createdNow, chat: { id: chat.id, type: chat.type, title: `@${other.username}` } };
};

// ─── List my chats with counterpart, last message and unread count ───────────
exports.listChats = async (userId) => {
  const rows = await sequelize.query(
    `SELECT c.id, c.type,
            u.username AS other_username, u.avatar_url AS other_avatar,
            lm.id AS last_id, lm.text AS last_text, lm.created_at AS last_at, lm.sender_id AS last_sender,
            (SELECT COUNT(*) FROM messages m
               WHERE m.chat_id = c.id AND m.sender_id <> :userId
                 AND m.created_at > me.last_read_at) AS unread
       FROM chat_members me
       JOIN chats c         ON c.id = me.chat_id
       JOIN chat_members om ON om.chat_id = c.id AND om.user_id <> :userId
       JOIN users u         ON u.id = om.user_id
       LEFT JOIN LATERAL (
         SELECT id, text, created_at, sender_id FROM messages
          WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1
       ) lm ON TRUE
      WHERE me.user_id = :userId
      ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );

  return rows.map((r) => ({
    id:     r.id,
    type:   r.type,
    title:  `@${r.other_username}`,
    avatar: r.other_avatar,
    lastMessage: r.last_id
      ? { id: r.last_id, text: r.last_text, senderId: r.last_sender, created_at: r.last_at }
      : null,
    unreadCount: Number(r.unread),
  }));
};

// ─── Messages (newest page first request; `cursor` = created_at of oldest loaded) ──
exports.listMessages = async (userId, chatId, { cursor, limit }) => {
  await exports.assertMember(userId, chatId);

  const take  = Math.min(Math.max(parseInt(limit, 10) || PAGE_SIZE, 1), 100);
  const where = { chat_id: chatId };
  if (cursor) where.created_at = { [Op.lt]: new Date(cursor) };

  const rows = await Message.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: take + 1,
  });

  const hasMore = rows.length > take;
  const page    = rows.slice(0, take).reverse(); // oldest → newest for display

  return {
    messages:   page.map(toMessage),
    nextCursor: hasMore ? page[0].created_at : null,
  };
};

// ─── Send: persist, then push to every member's personal socket room ─────────
exports.sendMessage = async (userId, chatId, rawText) => {
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  if (!text)                throw httpError(400, 'Message cannot be empty');
  if (text.length > MAX_TEXT) throw httpError(400, `Message too long (max ${MAX_TEXT})`);

  await exports.assertMember(userId, chatId);

  const msg     = await Message.create({ id: uuidv4(), chat_id: chatId, sender_id: userId, text });
  const payload = toMessage(msg);

  try {
    const io = require('../sockets').getIO();
    for (const id of await memberIds(chatId)) io.to(id).emit('message:receive', payload);
  } catch {
    // Sockets not initialised (e.g. REST-only tests) — message is still stored.
  }

  return payload;
};

// ─── Mark read ───────────────────────────────────────────────────────────────
exports.markRead = async (userId, chatId) => {
  await exports.assertMember(userId, chatId);
  await ChatMember.update(
    { last_read_at: new Date() },
    { where: { chat_id: chatId, user_id: userId } }
  );

  try {
    const io = require('../sockets').getIO();
    for (const id of await memberIds(chatId)) {
      if (id !== userId) io.to(id).emit('message:read', { chatId, by: userId });
    }
  } catch { /* sockets not initialised */ }
};

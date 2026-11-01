const { Op } = require('sequelize');
const { Thread, ThreadReply } = require('../models');
const policy    = require('../policies/thread.policy');
const httpError = require('../utils/httpError');

const PAGE = 20;
const authorAttrs = ['username', 'avatar_url'];
const author = (a) => (a ? { username: a.username, avatar_url: a.avatar_url } : null);

const toThread = (t, replyCount) => ({
  id: t.id, title: t.title, body: t.body, is_open: t.is_open, created_at: t.created_at,
  ownerId: t.owner_id, author: author(t.author), replyCount,
});
const toReply = (r) => ({ id: r.id, threadId: r.thread_id, body: r.body, created_at: r.created_at, userId: r.user_id, author: author(r.author) });

exports.list = async ({ cursor }) => {
  const where = cursor ? { created_at: { [Op.lt]: new Date(cursor) } } : {};
  const rows = await Thread.findAll({
    where, order: [['created_at', 'DESC']], limit: PAGE + 1,
    include: [{ association: 'author', attributes: authorAttrs }],
  });

  const hasMore = rows.length > PAGE;
  const page    = rows.slice(0, PAGE);

  const counts = page.length
    ? await ThreadReply.count({ where: { thread_id: page.map((t) => t.id) }, group: ['thread_id'] })
    : [];
  const byId = Object.fromEntries(counts.map((c) => [c.thread_id, Number(c.count)]));

  return {
    threads:    page.map((t) => toThread(t, byId[t.id] || 0)),
    nextCursor: hasMore ? page[page.length - 1].created_at : null,
  };
};

exports.get = async (id) => {
  const thread = await Thread.findByPk(id, { include: [{ association: 'author', attributes: authorAttrs }] });
  if (!thread) throw httpError(404, 'Thread not found');

  const replies = await ThreadReply.findAll({
    where: { thread_id: id }, order: [['created_at', 'ASC']], limit: 200,
    include: [{ association: 'author', attributes: authorAttrs }],
  });
  return { ...toThread(thread, replies.length), replies: replies.map(toReply) };
};

exports.create = async (userId, { title, body }) => {
  const t = await Thread.create({ owner_id: userId, title: title.trim(), body: body.trim() });
  return exports.get(t.id);
};

exports.reply = async (userId, threadId, body) => {
  const thread = await Thread.findByPk(threadId);
  if (!thread) throw httpError(404, 'Thread not found');
  if (!policy.canReplyToThread({ id: userId }, thread)) throw httpError(403, 'This thread is closed');

  const r = await ThreadReply.create({ thread_id: threadId, user_id: userId, body: body.trim() });
  const full = await ThreadReply.findByPk(r.id, { include: [{ association: 'author', attributes: authorAttrs }] });
  return toReply(full);
};

exports.remove = async (user, threadId) => {
  const thread = await Thread.findByPk(threadId);
  if (!thread) throw httpError(404, 'Thread not found');
  if (!policy.canDeleteThread(user, thread)) throw httpError(403, 'Only the author can delete this thread');
  await thread.destroy();
};

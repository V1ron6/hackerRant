const chatService = require('../services/chat.service');
const { ok, created } = require('../utils/response');

// GET /api/chats
exports.list = async (req, res, next) => {
  try {
    return ok(res, await chatService.listChats(req.user.id));
  } catch (err) { next(err); }
};

// POST /api/chats   { username }
exports.create = async (req, res, next) => {
  try {
    const { created: isNew, chat } = await chatService.createDm(req.user, req.body.username);
    return isNew ? created(res, chat, 'Chat created') : ok(res, chat, 'Chat already exists');
  } catch (err) { next(err); }
};

// GET /api/chats/:chatId/messages?cursor=&limit=
exports.messages = async (req, res, next) => {
  try {
    const { cursor, limit } = req.query;
    return ok(res, await chatService.listMessages(req.user.id, req.params.chatId, { cursor, limit }));
  } catch (err) { next(err); }
};

// POST /api/chats/:chatId/messages   { text }
exports.send = async (req, res, next) => {
  try {
    const msg = await chatService.sendMessage(req.user.id, req.params.chatId, req.body.text);
    return created(res, msg, 'Sent');
  } catch (err) { next(err); }
};

// POST /api/chats/:chatId/read
exports.read = async (req, res, next) => {
  try {
    await chatService.markRead(req.user.id, req.params.chatId);
    return ok(res, {}, 'Marked read');
  } catch (err) { next(err); }
};

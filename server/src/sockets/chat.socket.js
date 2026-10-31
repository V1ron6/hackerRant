const chatService = require('../services/chat.service');

// Max 20 messages per 10 s per socket.
const RATE_WINDOW_MS = 10_000;
const RATE_MAX       = 20;

module.exports = (io, socket) => {
  const userId = socket.user.id;

  // Join user's personal room
  socket.join(userId);

  // Chats this socket has already been verified as a member of (avoids a DB hit per typing event)
  const verified = new Set();
  const isMember = async (chatId) => {
    if (verified.has(chatId)) return true;
    try {
      await chatService.assertMember(userId, chatId);
      verified.add(chatId);
      return true;
    } catch {
      return false;
    }
  };

  const sentAt = [];

  // ─── Send message — { chatId, text }, replies via ack({ ok, message | error }) ──
  socket.on('message:send', async (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    try {
      const now = Date.now();
      while (sentAt.length && now - sentAt[0] > RATE_WINDOW_MS) sentAt.shift();
      if (sentAt.length >= RATE_MAX) return reply({ ok: false, error: 'Slow down' });
      sentAt.push(now);

      const message = await chatService.sendMessage(userId, payload?.chatId, payload?.text);
      reply({ ok: true, message });
    } catch (err) {
      reply({ ok: false, error: err.status && err.status < 500 ? err.message : 'Failed to send' });
    }
  });

  // ─── Typing indicators — { chatId } ────────────────────────────────────
  const relay = (event) => async (payload) => {
    const chatId = payload?.chatId;
    if (typeof chatId !== 'string' || !(await isMember(chatId))) return;
    for (const id of await chatService.memberIds(chatId)) {
      if (id !== userId) io.to(id).emit(event, { chatId, from: userId });
    }
  };
  socket.on('typing:start', relay('typing:start'));
  socket.on('typing:stop',  relay('typing:stop'));

  // ─── Read receipts — { chatId } ────────────────────────────────────────
  socket.on('message:read', async (payload) => {
    try {
      if (typeof payload?.chatId === 'string') await chatService.markRead(userId, payload.chatId);
    } catch { /* not a member — ignore */ }
  });
};

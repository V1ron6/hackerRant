const king = require('../middleware/security/king');

module.exports = (io, socket) => {
  const userId = socket.user.id;

  // Join user's personal room
  socket.join(userId);

  // ─── Send message ──────────────────────────────────────────────────────
  socket.on('message:send', async ({ to, content, threadId }) => {
    if (!to || !content) return;

    const sanitized = king(content.trim());

    const message = {
      from:      userId,
      to,
      content:   sanitized,
      threadId:  threadId || null,
      timestamp: new Date().toISOString(),
    };

    // Emit to recipient
    io.to(to).emit('message:receive', message);

    // Echo back to sender (for multi-device support)
    socket.emit('message:sent', message);
  });

  // ─── Typing indicators ─────────────────────────────────────────────────
  socket.on('typing:start', ({ to }) => {
    io.to(to).emit('typing:start', { from: userId });
  });

  socket.on('typing:stop', ({ to }) => {
    io.to(to).emit('typing:stop', { from: userId });
  });

  // ─── Read receipts ─────────────────────────────────────────────────────
  socket.on('message:read', ({ from, messageId }) => {
    io.to(from).emit('message:read', { by: userId, messageId });
  });

  // ─── Presence ──────────────────────────────────────────────────────────
  socket.on('presence:ping', ({ to }) => {
    io.to(to).emit('presence:ping', { from: userId });
  });
};

const { Server }          = require('socket.io');
const { createAdapter }   = require('@socket.io/redis-adapter');
const Redis               = require('ioredis');
const socketAuth          = require('../middleware/sockets/socketAuth');
const registerChatSocket  = require('./chat.socket');

let io;

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

exports.init = (server) => {
  io = new Server(server, {
    cors: {
      origin:      process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // Redis adapter for horizontal scaling
  const pubClient = new Redis(process.env.REDIS_URL);
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  // Auth middleware — runs before any connection
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.username}`);

    // Mark user online
    io.to(socket.user.id).emit('presence:online', socket.user.id);

    // ─── Aggressor — random anti-bot check ──────────────────────────────
    const interval = randomBetween(4, 7) * 60 * 1000;

    socket.aggressor = setInterval(() => {
      socket.emit('aggressor:verify');
    }, interval);

    socket.on('aggressor:pong', () => {
      // Client confirmed alive — nothing needed, just reset would go here
    });

    // ─── Register feature namespaces ────────────────────────────────────
    registerChatSocket(io, socket);

    socket.on('disconnect', () => {
      clearInterval(socket.aggressor);
      console.log(`Socket disconnected: ${socket.user.username}`);
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

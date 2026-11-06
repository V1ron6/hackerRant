require('dotenv').config();

const http    = require('http');
const app     = require('./app');
const { init: initSockets } = require('./src/sockets');
const { sequelize } = require('./src/models');
const { seedIfEmpty } = require('./src/services/resource.service');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

initSockets(server);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    await sequelize.sync({ alter: false });
    console.log('Models synced');

    await seedIfEmpty();

    // Disappearing messages and 24h stories: sweep expired rows every minute.
    const chatService   = require('./src/services/chat.service');
    const statusService = require('./src/services/status.service');
    const sweep = () => Promise.all([chatService.purgeExpired(), statusService.purgeExpired()])
      .catch((e) => console.error('Purge failed:', e.message));
    sweep();
    setInterval(sweep, 60 * 1000).unref();

    // Run the BullMQ email worker inside this process (one Render service
    // instead of two). Leave unset and use `npm run worker` to run it separately.
    if (process.env.RUN_EMAIL_WORKER === 'true') {
      require('./src/jobs/email.worker');
      console.log('Email worker started in-process');
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
})();

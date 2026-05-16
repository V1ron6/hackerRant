const { Queue }  = require('bullmq');
const redis      = require('../config/redis');

const emailQueue = new Queue('email', {
  connection: redis,
  defaultJobOptions: {
    attempts:  3,
    backoff: {
      type:  'exponential',
      delay: 3000,
    },
    removeOnComplete: 100,
    removeOnFail:     200,
  },
});

module.exports = emailQueue;

require('dotenv').config();

const { Worker } = require('bullmq');
const redis      = require('../config/redis');
const { sendEmail } = require('../services/mail.service');

const worker = new Worker(
  'email',
  async (job) => {
    console.log(`Processing email job: ${job.id}`);
    await sendEmail(job.data);
    console.log(`Email sent for job ${job.id}`);
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed',    (job, err) => console.error(`Job ${job?.id} failed:`, err.message));

module.exports = worker;

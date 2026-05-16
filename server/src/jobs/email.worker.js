require('dotenv').config();

const { Worker } = require('bullmq');
const redis      = require('../config/redis');

// Using Resend HTTP API — avoids Render SMTP port blocks
const sendEmail = async ({ to, subject, text }) => {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    process.env.MAIL_FROM,
      to:      [to],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }
};

const worker = new Worker(
  'email',
  async (job) => {
    console.log(`Processing email job: ${job.id}`);
    await sendEmail(job.data);
    console.log(`Email sent to ${job.data.to}`);
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed',    (job, err) => console.error(`Job ${job.id} failed:`, err.message));

module.exports = worker;

// Mailjet Send API v3.1 over HTTPS (Render blocks SMTP ports).
// MAILJET_API_URL is overridable so tests can point at a local fake.
const API_URL = () => process.env.MAILJET_API_URL || 'https://api.mailjet.com/v3.1/send';

exports.sendEmail = async ({ to, subject, text, html }) => {
  const key    = process.env.MAILJET_API_KEY;
  const secret = process.env.MAILJET_API_SECRET;
  const from   = process.env.MAIL_FROM;

  if (!key || !secret || !from) {
    throw new Error('Mailjet is not configured (MAILJET_API_KEY, MAILJET_API_SECRET, MAIL_FROM)');
  }

  const res = await fetch(API_URL(), {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Mailjet validates the payload and returns success without delivering.
      SandboxMode: process.env.MAILJET_SANDBOX === 'true',
      Messages: [{
        From:     { Email: from, Name: process.env.MAIL_FROM_NAME || 'hackerRant' },
        To:       [{ Email: to }],
        Subject:  subject,
        TextPart: text,
        ...(html ? { HTMLPart: html } : {}),
      }],
    }),
  });

  const body = await res.json().catch(() => null);
  const msg  = body?.Messages?.[0];

  if (!res.ok || (msg && msg.Status !== 'success')) {
    throw new Error(`Mailjet error ${res.status}: ${JSON.stringify(msg?.Errors || body)}`);
  }
};

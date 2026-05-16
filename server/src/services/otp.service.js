const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { OtpStore }   = require('../models');
const redis          = require('../config/redis');

const OTP_TTL_MINUTES = 10;

// Generate a 6-digit OTP, hash it, store in DB
exports.createOtp = async (target, purpose) => {
  const otp     = crypto.randomInt(100000, 999999).toString();
  const hash    = await bcrypt.hash(otp, 10);
  const expires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Invalidate any existing OTPs for this target + purpose
  await OtpStore.update(
    { used: true },
    { where: { target, purpose, used: false } }
  );

  await OtpStore.create({
    id:         uuidv4(),
    target,
    otp_hash:   hash,
    purpose,
    expires_at: expires,
  });

  return otp; // raw OTP to send via email/SMS
};

// Verify OTP submitted by user
exports.verifyOtp = async (target, purpose, submittedOtp) => {
  const record = await OtpStore.findOne({
    where: { target, purpose, used: false },
    order: [['expires_at', 'DESC']],
  });

  if (!record || new Date(record.expires_at) < new Date()) {
    return false;
  }

  const match = await bcrypt.compare(submittedOtp, record.otp_hash);

  if (match) {
    record.used = true;
    await record.save();
  }

  return match;
};

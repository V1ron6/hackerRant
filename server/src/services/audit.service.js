const { v4: uuidv4 } = require('uuid');
const { AuditLog }   = require('../models');

exports.log = async (userId, action, metadata = {}) => {
  try {
    await AuditLog.create({
      id:       uuidv4(),
      user_id:  userId,
      action,
      metadata,
    });
  } catch (err) {
    // Don't crash the request if audit logging fails
    console.error('Audit log error:', err.message);
  }
};

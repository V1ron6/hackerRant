const { Session, Ticket } = require('../models');

// All active sessions for a user
exports.getUserSessions = async (userId) => {
  return Session.findAll({
    where: { user_id: userId, is_revoked: false },
    order: [['last_active_at', 'DESC']],
  });
};

// Revoke a single session
exports.revokeSession = async (sessionId, userId) => {
  const session = await Session.findOne({
    where: { id: sessionId, user_id: userId },
  });

  if (!session) {
    throw Object.assign(new Error('Session not found'), { status: 404 });
  }

  session.is_revoked = true;
  await session.save();

  // Blacklist the matching ticket
  await Ticket.update(
    { is_blacklisted: true },
    { where: { user_id: userId, fingerprint: session.fingerprint } }
  );
};

// Revoke ALL sessions for a user
exports.revokeAllSessions = async (userId) => {
  await Session.update(
    { is_revoked: true },
    { where: { user_id: userId } }
  );

  await Ticket.update(
    { is_blacklisted: true },
    { where: { user_id: userId } }
  );
};

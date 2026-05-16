const { AuditLog, User } = require('../../models');

// Suspends user after 2 ticket resets
module.exports = async (userId) => {
  const count = await AuditLog.count({
    where: {
      user_id: userId,
      action:  'TICKET_RESET',
    },
  });

  if (count >= 2) {
    await User.update(
      { status: 'suspended' },
      { where: { id: userId } }
    );

    throw Object.assign(
      new Error('ESCANOR: Too many ticket resets. Account suspended.'),
      { status: 403 }
    );
  }
};

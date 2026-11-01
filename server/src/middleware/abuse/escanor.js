const { Op }             = require('sequelize');
const { AuditLog, User } = require('../../models');

const WINDOW_DAYS = 30;
const MAX_PER_WINDOW = 2;

// buildi.txt: more than 2 ticket resets/changes per month suspends the account.
// Call this BEFORE performing a change/reset. Only *completed* actions are logged,
// so requesting a reset email for someone else's address can't get them suspended.
module.exports = async (userId) => {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const count = await AuditLog.count({
    where: {
      user_id:    userId,
      action:     { [Op.in]: ['TICKET_RESET', 'TICKET_CHANGE'] },
      created_at: { [Op.gte]: since },
    },
  });

  if (count >= MAX_PER_WINDOW) {
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

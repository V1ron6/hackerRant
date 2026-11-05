// Usage: node scripts/unlock-user.js <email|username>
// Re-activates a suspended account (e.g. after ESCANOR tripped while testing),
// clears its ticket change/reset history, and revokes old tickets/sessions so the
// next login starts clean.
require('dotenv').config();
const { Op } = require('sequelize');
const { User, Ticket, Session, AuditLog } = require('../src/models');

(async () => {
  const id = (process.argv[2] || '').trim().toLowerCase();
  if (!id) { console.error('Usage: node scripts/unlock-user.js <email|username>'); process.exit(1); }

  const user = await User.findOne({ where: id.includes('@') ? { email: id } : { username: id } });
  if (!user) { console.error('User not found'); process.exit(1); }

  await user.update({ status: 'active' });
  await AuditLog.destroy({ where: { user_id: user.id, action: { [Op.in]: ['TICKET_RESET', 'TICKET_CHANGE'] } } });
  await Ticket.update({ is_blacklisted: true }, { where: { user_id: user.id } });
  await Session.update({ is_revoked: true }, { where: { user_id: user.id } });

  console.log(`Unlocked ${user.username}. Log in again to get a fresh ticket.`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });

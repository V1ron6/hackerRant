const sequelize = require('../config/db');

const User     = require('./user.model');
const Ticket   = require('./ticket.model');
const Session  = require('./session.model');
const AuditLog = require('./auditLog.model');
const OtpStore = require('./otpStore.model');

// ─── Associations ─────────────────────────────────────────────────────────────
User.hasMany(Ticket,   { foreignKey: 'user_id', onDelete: 'CASCADE' });
Ticket.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Session,   { foreignKey: 'user_id', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AuditLog,   { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Ticket,
  Session,
  AuditLog,
  OtpStore,
};

const sequelize = require('../config/db');

const User     = require('./user.model');
const Ticket   = require('./ticket.model');
const Session  = require('./session.model');
const AuditLog = require('./auditLog.model');
const OtpStore = require('./otpStore.model');
const Chat       = require('./chat.model');
const ChatMember = require('./chatMember.model');
const Message    = require('./message.model');

// ─── Associations ─────────────────────────────────────────────────────────────
User.hasMany(Ticket,   { foreignKey: 'user_id', onDelete: 'CASCADE' });
Ticket.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Session,   { foreignKey: 'user_id', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AuditLog,   { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

Chat.hasMany(ChatMember,   { foreignKey: 'chat_id', onDelete: 'CASCADE' });
ChatMember.belongsTo(Chat, { foreignKey: 'chat_id' });
User.hasMany(ChatMember,   { foreignKey: 'user_id', onDelete: 'CASCADE' });
ChatMember.belongsTo(User, { foreignKey: 'user_id' });

Chat.hasMany(Message,   { foreignKey: 'chat_id', onDelete: 'CASCADE' });
Message.belongsTo(Chat, { foreignKey: 'chat_id' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

module.exports = {
  sequelize,
  User,
  Ticket,
  Session,
  AuditLog,
  OtpStore,
  Chat,
  ChatMember,
  Message,
};

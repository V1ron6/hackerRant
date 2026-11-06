const sequelize = require('../config/db');

const User     = require('./user.model');
const Ticket   = require('./ticket.model');
const Session  = require('./session.model');
const AuditLog = require('./auditLog.model');
const OtpStore = require('./otpStore.model');
const Chat       = require('./chat.model');
const ChatMember = require('./chatMember.model');
const Message    = require('./message.model');
const UserSettings = require('./userSettings.model');
const StatusPost   = require('./statusPost.model');
const Thread       = require('./thread.model');
const ThreadReply  = require('./threadReply.model');
const Resource     = require('./resource.model');
const Complaint    = require('./complaint.model');
const Follow       = require('./follow.model');
const Block        = require('./block.model');
const StatusView   = require('./statusView.model');
const Reel         = require('./reel.model');
const ReelLike     = require('./reelLike.model');

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

User.hasOne(UserSettings,   { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserSettings.belongsTo(User, { foreignKey: 'user_id' });

StatusPost.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

Thread.belongsTo(User,    { foreignKey: 'owner_id', as: 'author' });
Thread.hasMany(ThreadReply, { foreignKey: 'thread_id', as: 'replies', onDelete: 'CASCADE' });
ThreadReply.belongsTo(Thread, { foreignKey: 'thread_id' });
ThreadReply.belongsTo(User,   { foreignKey: 'user_id', as: 'author' });

Complaint.belongsTo(User, { foreignKey: 'user_id' });

Follow.belongsTo(User, { foreignKey: 'follower_id', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followee_id', as: 'followee' });
Block.belongsTo(User,  { foreignKey: 'blocked_id',  as: 'blocked' });

StatusPost.hasMany(StatusView, { foreignKey: 'status_id', as: 'views', onDelete: 'CASCADE' });
StatusView.belongsTo(StatusPost, { foreignKey: 'status_id' });
StatusView.belongsTo(User, { foreignKey: 'viewer_id', as: 'viewer' });

Reel.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
Reel.hasMany(ReelLike, { foreignKey: 'reel_id', as: 'likes', onDelete: 'CASCADE' });
ReelLike.belongsTo(Reel, { foreignKey: 'reel_id' });

module.exports = {
  sequelize,
  UserSettings,
  StatusPost,
  Thread,
  ThreadReply,
  Resource,
  Complaint,
  Follow,
  Block,
  StatusView,
  Reel,
  ReelLike,
  User,
  Ticket,
  Session,
  AuditLog,
  OtpStore,
  Chat,
  ChatMember,
  Message,
};

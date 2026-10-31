const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const ChatMember = sequelize.define('ChatMember', {
  chat_id: {
    type:       DataTypes.CHAR(36),
    primaryKey: true,
  },
  user_id: {
    type:       DataTypes.CHAR(36),
    primaryKey: true,
  },
  // Messages from others newer than this count as unread.
  last_read_at: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:  'chat_members',
  timestamps: false,
  indexes:    [{ fields: ['user_id'] }],
});

module.exports = ChatMember;

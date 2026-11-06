const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const UserSettings = sequelize.define('UserSettings', {
  user_id: {
    type:       DataTypes.CHAR(36),
    primaryKey: true,
  },
  notifications: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
  chat_theme: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'default',
  },
  // Opt-in. Nearby discovery only works between users who both turned this on.
  share_location: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },
  // When off, others are not told when you read their messages.
  read_receipts: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  // 'everyone' or 'following' (only people you follow can message you).
  who_can_message: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'everyone' },
}, {
  tableName:  'user_settings',
  timestamps: false,
});

module.exports = UserSettings;

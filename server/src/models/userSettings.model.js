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
}, {
  tableName:  'user_settings',
  timestamps: false,
});

module.exports = UserSettings;

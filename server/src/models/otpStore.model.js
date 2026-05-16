const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const OtpStore = sequelize.define('OtpStore', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  target: {
    type:      DataTypes.STRING(100),
    allowNull: false,
  },
  otp_hash: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  purpose: {
    type: DataTypes.ENUM('register', 'ticket_reset', 'device_link'),
  },
  expires_at: {
    type:      DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName:  'otp_store',
  timestamps: false,
});

module.exports = OtpStore;

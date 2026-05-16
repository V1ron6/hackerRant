const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const Session = sequelize.define('Session', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id: {
    type:      DataTypes.CHAR(36),
    allowNull: false,
  },
  fingerprint: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  user_agent:     DataTypes.TEXT,
  ip_address:     DataTypes.STRING(45),
  last_active_at: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_revoked: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName:  'sessions',
  timestamps: false,
});

module.exports = Session;

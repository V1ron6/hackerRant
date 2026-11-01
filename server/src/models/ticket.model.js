const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const Ticket = sequelize.define('Ticket', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id: {
    type:      DataTypes.CHAR(36),
    allowNull: false,
  },
  token_hash: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    unique:    true,
  },
  fingerprint: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  partial_ip:     DataTypes.STRING(45),
  expires_at: {
    type:      DataTypes.DATE,
    allowNull: false,
  },
  is_blacklisted: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName:  'tickets',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = Ticket;

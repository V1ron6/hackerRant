const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const Complaint = sequelize.define('Complaint', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id: {
    type:      DataTypes.CHAR(36),
    allowNull: false,
  },
  subject: {
    type:      DataTypes.STRING(120),
    allowNull: false,
  },
  message: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type:         DataTypes.ENUM('open', 'resolved'),
    allowNull:    false,
    defaultValue: 'open',
  },
}, {
  tableName:  'complaints',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
  indexes:    [{ fields: ['user_id'] }],
});

module.exports = Complaint;

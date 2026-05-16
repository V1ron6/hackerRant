const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id:  DataTypes.CHAR(36),
  action:   DataTypes.STRING(100),
  metadata: DataTypes.JSON,
}, {
  tableName:  'audit_logs',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = AuditLog;

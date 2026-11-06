const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const StatusView = sequelize.define('StatusView', {
  status_id:  { type: DataTypes.CHAR(36), primaryKey: true },
  viewer_id:  { type: DataTypes.CHAR(36), primaryKey: true },
}, {
  tableName:  'status_views',
  timestamps: true,
  createdAt:  'viewed_at',
  updatedAt:  false,
  indexes:    [{ fields: ['viewer_id'] }],
});

module.exports = StatusView;

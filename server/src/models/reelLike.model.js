const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const ReelLike = sequelize.define('ReelLike', {
  reel_id: { type: DataTypes.CHAR(36), primaryKey: true },
  user_id: { type: DataTypes.CHAR(36), primaryKey: true },
}, {
  tableName:  'reel_likes',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = ReelLike;

const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

// follower_id subscribes to followee_id's stories and reels.
const Follow = sequelize.define('Follow', {
  follower_id: { type: DataTypes.CHAR(36), primaryKey: true },
  followee_id: { type: DataTypes.CHAR(36), primaryKey: true },
}, {
  tableName:  'follows',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
  indexes:    [{ fields: ['followee_id'] }],
});

module.exports = Follow;

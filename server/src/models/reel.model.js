const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

// Short vertical video. Unlike status posts, reels do not expire.
const Reel = sequelize.define('Reel', {
  id:        { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id:   { type: DataTypes.CHAR(36), allowNull: false },
  video_url: { type: DataTypes.STRING(500), allowNull: false },
  caption:   DataTypes.STRING(150),
  // 'public' = everyone, 'followers' = only people who follow the author.
  visibility: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'public' },
}, {
  tableName:  'reels',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
  indexes:    [{ fields: ['created_at'] }, { fields: ['user_id'] }],
});

module.exports = Reel;

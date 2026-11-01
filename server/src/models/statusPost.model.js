const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const StatusPost = sequelize.define('StatusPost', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id: {
    type:      DataTypes.CHAR(36),
    allowNull: false,
  },
  kind: {
    type:      DataTypes.ENUM('text', 'image', 'video', 'audio'),
    allowNull: false,
  },
  text:      DataTypes.TEXT,
  media_url: DataTypes.STRING(500),
}, {
  tableName:  'status_posts',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
  indexes:    [{ fields: ['created_at'] }],
});

module.exports = StatusPost;

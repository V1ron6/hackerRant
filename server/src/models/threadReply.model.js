const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const ThreadReply = sequelize.define('ThreadReply', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  thread_id: {
    type:      DataTypes.CHAR(36),
    allowNull: false,
  },
  user_id: {
    type:      DataTypes.CHAR(36),
    allowNull: false,
  },
  body: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName:  'thread_replies',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
  indexes:    [{ fields: ['thread_id', 'created_at'] }],
});

module.exports = ThreadReply;

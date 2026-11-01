const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const Thread = sequelize.define('Thread', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  owner_id: {
    type:      DataTypes.CHAR(36),
    allowNull: false,
  },
  title: {
    type:      DataTypes.STRING(150),
    allowNull: false,
  },
  body: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },
  is_open: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
}, {
  tableName:  'threads',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
  indexes:    [{ fields: ['created_at'] }],
});

module.exports = Thread;

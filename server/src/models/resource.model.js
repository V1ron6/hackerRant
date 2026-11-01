const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const Resource = sequelize.define('Resource', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  title: {
    type:      DataTypes.STRING(120),
    allowNull: false,
  },
  url: {
    type:      DataTypes.STRING(500),
    allowNull: false,
  },
  description: DataTypes.STRING(300),
  category: {
    type:         DataTypes.STRING(50),
    allowNull:    false,
    defaultValue: 'General',
  },
}, {
  tableName:  'resources',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = Resource;

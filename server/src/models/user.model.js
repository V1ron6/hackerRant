const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  username: {
    type:      DataTypes.STRING(30),
    allowNull: false,
    unique:    true,
  },
  first_name: DataTypes.STRING(50),
  last_name:  DataTypes.STRING(50),
  email: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
  },
  phone: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    unique:    true,
  },
  password_hash: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  dob:        DataTypes.DATEONLY,
  bio:        DataTypes.TEXT,
  avatar_url: DataTypes.STRING(300),
  latitude:   DataTypes.DECIMAL(10, 8),
  longitude:  DataTypes.DECIMAL(11, 8),
  status: {
    type:         DataTypes.ENUM('active', 'suspended', 'deleted'),
    defaultValue: 'active',
  },
}, {
  tableName:  'users',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = User;

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
  // Set once the registration OTP is verified. Login is refused until then.
  // (New column: a database created from an earlier version needs
  //  ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;)
  email_verified: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
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

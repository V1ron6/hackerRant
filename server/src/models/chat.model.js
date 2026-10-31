const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

// A direct-message chat between exactly two users.
// dm_key = the two user ids sorted and joined, so a pair can only ever have one chat.
const Chat = sequelize.define('Chat', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  type: {
    type:         DataTypes.ENUM('dm'),
    defaultValue: 'dm',
  },
  dm_key: {
    type:      DataTypes.STRING(80),
    allowNull: false,
    unique:    true,
  },
}, {
  tableName:  'chats',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
});

module.exports = Chat;

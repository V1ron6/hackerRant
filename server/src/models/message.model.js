const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

// Stored raw. React escapes on render; do not HTML-encode on output or
// "a < b" would show up as "a &lt; b" in the client.
const Message = sequelize.define('Message', {
  id: {
    type:         DataTypes.CHAR(36),
    primaryKey:   true,
    defaultValue: DataTypes.UUIDV4,
  },
  chat_id: {
    type:      DataTypes.CHAR(36),
    allowNull: false,
  },
  sender_id: {
    type:      DataTypes.CHAR(36),
    allowNull: false,
  },
  text: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName:  'messages',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
  indexes:    [{ fields: ['chat_id', 'created_at'] }],
});

module.exports = Message;

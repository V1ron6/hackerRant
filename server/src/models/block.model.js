const { DataTypes } = require('sequelize');
const sequelize     = require('../config/db');

// blocker_id blocked blocked_id. Blocking is mutual in effect: neither side can
// message, see stories/reels of, or find the other.
const Block = sequelize.define('Block', {
  blocker_id: { type: DataTypes.CHAR(36), primaryKey: true },
  blocked_id: { type: DataTypes.CHAR(36), primaryKey: true },
}, {
  tableName:  'blocks',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false,
  indexes:    [{ fields: ['blocked_id'] }],
});

module.exports = Block;

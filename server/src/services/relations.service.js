const { Op } = require('sequelize');
const { Follow, Block } = require('../models');

// Everyone who is blocked by me OR has blocked me (blocking hides both sides from each other).
exports.blockedEitherWay = async (userId) => {
  const rows = await Block.findAll({
    where: { [Op.or]: [{ blocker_id: userId }, { blocked_id: userId }] },
    attributes: ['blocker_id', 'blocked_id'],
  });
  return [...new Set(rows.map((r) => (r.blocker_id === userId ? r.blocked_id : r.blocker_id)))];
};

exports.isBlocked = async (a, b) =>
  !!(await Block.findOne({
    where: { [Op.or]: [{ blocker_id: a, blocked_id: b }, { blocker_id: b, blocked_id: a }] },
  }));

exports.followingIds = async (userId) =>
  (await Follow.findAll({ where: { follower_id: userId }, attributes: ['followee_id'] })).map((f) => f.followee_id);

// Does `followerId` follow `followeeId`?
exports.isFollowing = async (followerId, followeeId) =>
  !!(await Follow.findOne({ where: { follower_id: followerId, followee_id: followeeId } }));

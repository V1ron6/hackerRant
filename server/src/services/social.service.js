const { Op } = require('sequelize');
const { sequelize, User, Follow, Block, Chat } = require('../models');
const httpError = require('../utils/httpError');
const rel = require('./relations.service');

const userAttrs = ['id', 'username', 'first_name', 'last_name', 'avatar_url'];
const pub = (u) => ({ username: u.username, first_name: u.first_name, last_name: u.last_name, avatar_url: u.avatar_url });

const target = async (username) => {
  const u = await User.findOne({ where: { username: String(username).toLowerCase(), status: 'active' }, attributes: userAttrs });
  if (!u) throw httpError(404, 'User not found');
  return u;
};

exports.follow = async (me, username) => {
  const other = await target(username);
  if (other.id === me) throw httpError(400, 'You cannot follow yourself');
  if (await rel.isBlocked(me, other.id)) throw httpError(403, 'You cannot follow this user');
  await Follow.findOrCreate({ where: { follower_id: me, followee_id: other.id } });
};

exports.unfollow = async (me, username) => {
  const other = await target(username);
  await Follow.destroy({ where: { follower_id: me, followee_id: other.id } });
};

// Blocking also removes the follow relationship in both directions.
exports.block = async (me, username) => {
  const other = await target(username);
  if (other.id === me) throw httpError(400, 'You cannot block yourself');
  await sequelize.transaction(async (t) => {
    await Block.findOrCreate({ where: { blocker_id: me, blocked_id: other.id }, transaction: t });
    await Follow.destroy({
      where: { [Op.or]: [{ follower_id: me, followee_id: other.id }, { follower_id: other.id, followee_id: me }] },
      transaction: t,
    });
  });
};

exports.unblock = async (me, username) => {
  const other = await target(username);
  await Block.destroy({ where: { blocker_id: me, blocked_id: other.id } });
};

exports.listBlocked = async (me) => {
  const rows = await Block.findAll({
    where: { blocker_id: me }, order: [['created_at', 'DESC']],
    include: [{ association: 'blocked', attributes: userAttrs }],
  });
  return rows.filter((r) => r.blocked).map((r) => pub(r.blocked));
};

exports.listFollowing = async (me) => {
  const rows = await Follow.findAll({
    where: { follower_id: me }, order: [['created_at', 'DESC']],
    include: [{ association: 'followee', attributes: userAttrs }],
  });
  return rows.filter((r) => r.followee).map((r) => pub(r.followee));
};

exports.listFollowers = async (me) => {
  const rows = await Follow.findAll({
    where: { followee_id: me }, order: [['created_at', 'DESC']],
    include: [{ association: 'follower', attributes: userAttrs }],
  });
  return rows.filter((r) => r.follower).map((r) => pub(r.follower));
};

// How I relate to a profile I'm looking at.
exports.relationship = async (me, username) => {
  const other = await target(username);
  const [following, followedBy, iBlocked, theyBlocked, followers, followingCount] = await Promise.all([
    Follow.count({ where: { follower_id: me, followee_id: other.id } }),
    Follow.count({ where: { follower_id: other.id, followee_id: me } }),
    Block.count({ where: { blocker_id: me, blocked_id: other.id } }),
    Block.count({ where: { blocker_id: other.id, blocked_id: me } }),
    Follow.count({ where: { followee_id: other.id } }),
    Follow.count({ where: { follower_id: other.id } }),
  ]);
  return {
    following: !!following, followedBy: !!followedBy,
    blocked: !!iBlocked, blockedByThem: !!theyBlocked,
    followers, followingCount,
  };
};

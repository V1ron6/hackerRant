const { Op } = require('sequelize');
const { StatusPost, StatusView } = require('../models');
const storage   = require('./storage.service');
const rel       = require('./relations.service');
const httpError = require('../utils/httpError');

const DAY_MS = 24 * 60 * 60 * 1000;
const authorAttrs = ['username', 'avatar_url'];
const VISIBILITY = ['public', 'followers'];

const toPost = (p, extra = {}) => ({
  id: p.id, kind: p.kind, text: p.text, media_url: p.media_url, created_at: p.created_at,
  visibility: p.visibility,
  userId: p.user_id,
  author: p.author ? { username: p.author.username, avatar_url: p.author.avatar_url } : null,
  ...extra,
});

// Status posts live for 24 hours. scope='following' shows only people I follow (Snapchat-style subscriptions).
// Hidden: anyone blocked either way; followers-only posts from people I don't follow.
exports.list = async (me, { scope } = {}) => {
  const [blocked, following] = await Promise.all([rel.blockedEitherWay(me), rel.followingIds(me)]);

  const notBlocked = blocked.length ? [{ user_id: { [Op.notIn]: blocked } }] : [];
  const visibleToMe = { [Op.or]: [{ visibility: 'public' }, ...(following.length ? [{ user_id: { [Op.in]: following } }] : [])] };

  let who;
  if (scope === 'following') {
    // Only people I follow; if I follow nobody the feed is empty.
    who = following.length ? { [Op.and]: [{ user_id: { [Op.in]: following } }, ...notBlocked] } : { user_id: null };
  } else {
    who = { [Op.or]: [{ user_id: me }, { [Op.and]: [visibleToMe, ...notBlocked] }] };
  }

  const where = { created_at: { [Op.gte]: new Date(Date.now() - DAY_MS) }, ...who };

  const rows = await StatusPost.findAll({
    where,
    include: [{ association: 'author', attributes: authorAttrs }],
    order:   [['created_at', 'DESC']],
    limit:   50,
  });

  const ids = rows.map((r) => r.id);
  const seen = ids.length
    ? new Set((await StatusView.findAll({ where: { viewer_id: me, status_id: { [Op.in]: ids } }, attributes: ['status_id'] })).map((v) => v.status_id))
    : new Set();

  const mineIds = rows.filter((r) => r.user_id === me).map((r) => r.id);
  const counts = {};
  if (mineIds.length) {
    const all = await StatusView.findAll({ where: { status_id: { [Op.in]: mineIds } }, attributes: ['status_id'] });
    for (const v of all) counts[v.status_id] = (counts[v.status_id] || 0) + 1;
  }

  return rows.map((p) => toPost(p, p.user_id === me
    ? { viewCount: counts[p.id] || 0 }
    : { viewed: seen.has(p.id) }));
};

exports.create = async (userId, { kind, text, media_url, visibility }) => {
  const clean = typeof text === 'string' ? text.trim() : '';
  const vis = visibility === undefined ? 'public' : visibility;
  if (!VISIBILITY.includes(vis)) throw httpError(400, 'Invalid visibility');

  if (kind === 'text') {
    if (!clean) throw httpError(400, 'Write something first');
    if (media_url) throw httpError(400, 'Text posts cannot have media');
  } else {
    if (!storage.isOwnUrl(media_url)) throw httpError(400, 'Upload the file first, then post it');
  }

  const post = await StatusPost.create({
    user_id: userId, kind, text: clean || null, media_url: kind === 'text' ? null : media_url, visibility: vis,
  });
  return toPost(await StatusPost.findByPk(post.id, { include: [{ association: 'author', attributes: authorAttrs }] }), { viewCount: 0 });
};

exports.remove = async (userId, id) => {
  const n = await StatusPost.destroy({ where: { id, user_id: userId } });
  if (!n) throw httpError(404, 'Post not found');
};

// Same 404 for "missing", "expired" and "not allowed" so ids can't be probed.
const loadVisible = async (me, id) => {
  const post = await StatusPost.findOne({ where: { id, created_at: { [Op.gte]: new Date(Date.now() - DAY_MS) } } });
  if (!post) throw httpError(404, 'Post not found');
  if (post.user_id === me) return post;
  if (await rel.isBlocked(me, post.user_id)) throw httpError(404, 'Post not found');
  if (post.visibility === 'followers' && !(await rel.isFollowing(me, post.user_id))) throw httpError(404, 'Post not found');
  return post;
};

// Record that I saw someone's story (never counts the author's own views).
exports.markViewed = async (me, id) => {
  const post = await loadVisible(me, id);
  if (post.user_id === me) return;
  await StatusView.findOrCreate({ where: { status_id: id, viewer_id: me } });
};

// Only the author can see who viewed their post.
exports.viewers = async (me, id) => {
  const post = await StatusPost.findOne({ where: { id, user_id: me } });
  if (!post) throw httpError(404, 'Post not found');
  const rows = await StatusView.findAll({
    where: { status_id: id }, order: [['viewed_at', 'DESC']], limit: 200,
    include: [{ association: 'viewer', attributes: authorAttrs }],
  });
  return rows.filter((r) => r.viewer).map((r) => ({
    username: r.viewer.username, avatar_url: r.viewer.avatar_url, viewed_at: r.viewed_at,
  }));
};

// Housekeeping: expired posts (and, via CASCADE-less cleanup, their views) are removed.
exports.purgeExpired = async () => {
  const cutoff = new Date(Date.now() - DAY_MS);
  const old = await StatusPost.findAll({ where: { created_at: { [Op.lt]: cutoff } }, attributes: ['id'], limit: 500 });
  if (!old.length) return 0;
  const ids = old.map((o) => o.id);
  await StatusView.destroy({ where: { status_id: { [Op.in]: ids } } });
  return StatusPost.destroy({ where: { id: { [Op.in]: ids } } });
};

const { Op } = require('sequelize');
const { Reel, ReelLike } = require('../models');
const storage   = require('./storage.service');
const rel       = require('./relations.service');
const httpError = require('../utils/httpError');

const PAGE = 8;
const authorAttrs = ['username', 'avatar_url'];

const toReel = (r, likeCount, liked) => ({
  id: r.id, video_url: r.video_url, caption: r.caption, visibility: r.visibility, created_at: r.created_at,
  userId: r.user_id,
  author: r.author ? { username: r.author.username, avatar_url: r.author.avatar_url } : null,
  likeCount, liked,
});

const decorate = async (me, rows) => {
  const ids = rows.map((r) => r.id);
  const likes = ids.length ? await ReelLike.findAll({ where: { reel_id: { [Op.in]: ids } }, attributes: ['reel_id', 'user_id'] }) : [];
  const count = {}; const mine = new Set();
  for (const l of likes) { count[l.reel_id] = (count[l.reel_id] || 0) + 1; if (l.user_id === me) mine.add(l.reel_id); }
  return rows.map((r) => toReel(r, count[r.id] || 0, mine.has(r.id)));
};

// Newest first, cursor = created_at of the last reel received. scope='following' limits to people I follow.
exports.feed = async (me, { cursor, scope, username } = {}) => {
  const [blocked, following] = await Promise.all([rel.blockedEitherWay(me), rel.followingIds(me)]);
  const and = [];
  if (blocked.length) and.push({ user_id: { [Op.notIn]: blocked } });
  if (cursor) and.push({ created_at: { [Op.lt]: new Date(cursor) } });

  if (scope === 'following') {
    and.push(following.length ? { user_id: { [Op.in]: following } } : { user_id: null });
  } else {
    and.push({ [Op.or]: [
      { user_id: me }, { visibility: 'public' },
      ...(following.length ? [{ user_id: { [Op.in]: following } }] : []),
    ] });
  }

  const rows = await Reel.findAll({
    where: { [Op.and]: and },
    include: [{ association: 'author', attributes: authorAttrs }],
    order: [['created_at', 'DESC']],
    limit: PAGE + 1,
  });
  const page = rows.slice(0, PAGE);
  return { reels: await decorate(me, page), nextCursor: rows.length > PAGE ? page[page.length - 1].created_at : null };
};

exports.create = async (me, { video_url, caption, visibility }) => {
  if (!storage.isOwnUrl(video_url) || !/\.(mp4|webm)$/.test(video_url)) throw httpError(400, 'Upload a video first, then post it');
  const vis = visibility === undefined ? 'public' : visibility;
  if (!['public', 'followers'].includes(vis)) throw httpError(400, 'Invalid visibility');
  const clean = typeof caption === 'string' ? caption.trim() : '';

  const r = await Reel.create({ user_id: me, video_url, caption: clean || null, visibility: vis });
  const full = await Reel.findByPk(r.id, { include: [{ association: 'author', attributes: authorAttrs }] });
  return toReel(full, 0, false);
};

exports.remove = async (me, id) => {
  const n = await Reel.destroy({ where: { id, user_id: me } });
  if (!n) throw httpError(404, 'Reel not found');
};

const loadVisible = async (me, id) => {
  const r = await Reel.findByPk(id);
  if (!r) throw httpError(404, 'Reel not found');
  if (r.user_id === me) return r;
  if (await rel.isBlocked(me, r.user_id)) throw httpError(404, 'Reel not found');
  if (r.visibility === 'followers' && !(await rel.isFollowing(me, r.user_id))) throw httpError(404, 'Reel not found');
  return r;
};

exports.like = async (me, id) => {
  await loadVisible(me, id);
  await ReelLike.findOrCreate({ where: { reel_id: id, user_id: me } });
  return { liked: true, likeCount: await ReelLike.count({ where: { reel_id: id } }) };
};

exports.unlike = async (me, id) => {
  await loadVisible(me, id);
  await ReelLike.destroy({ where: { reel_id: id, user_id: me } });
  return { liked: false, likeCount: await ReelLike.count({ where: { reel_id: id } }) };
};

const { Op } = require('sequelize');
const { StatusPost } = require('../models');
const storage   = require('./storage.service');
const httpError = require('../utils/httpError');

const DAY_MS = 24 * 60 * 60 * 1000;
const authorAttrs = ['username', 'avatar_url'];

const toPost = (p) => ({
  id: p.id, kind: p.kind, text: p.text, media_url: p.media_url, created_at: p.created_at,
  userId: p.user_id,
  author: p.author ? { username: p.author.username, avatar_url: p.author.avatar_url } : null,
});

// Status posts live for 24 hours.
exports.list = async () => {
  const rows = await StatusPost.findAll({
    where:   { created_at: { [Op.gte]: new Date(Date.now() - DAY_MS) } },
    include: [{ association: 'author', attributes: authorAttrs }],
    order:   [['created_at', 'DESC']],
    limit:   50,
  });
  return rows.map(toPost);
};

exports.create = async (userId, { kind, text, media_url }) => {
  const clean = typeof text === 'string' ? text.trim() : '';

  if (kind === 'text') {
    if (!clean) throw httpError(400, 'Write something first');
    if (media_url) throw httpError(400, 'Text posts cannot have media');
  } else {
    if (!storage.isOwnUrl(media_url)) throw httpError(400, 'Upload the file first, then post it');
  }

  const post = await StatusPost.create({
    user_id: userId, kind, text: clean || null, media_url: kind === 'text' ? null : media_url,
  });
  return toPost(await StatusPost.findByPk(post.id, { include: [{ association: 'author', attributes: authorAttrs }] }));
};

exports.remove = async (userId, id) => {
  const n = await StatusPost.destroy({ where: { id, user_id: userId } });
  if (!n) throw httpError(404, 'Post not found');
};

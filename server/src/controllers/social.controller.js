const svc = require('../services/social.service');
const { ok } = require('../utils/response');

const act = (fn, msg) => async (req, res, next) => {
  try { await fn(req.user.id, req.params.username); return ok(res, {}, msg); } catch (e) { next(e); }
};
const read = (fn) => async (req, res, next) => {
  try { return ok(res, await fn(req.user.id, req.params.username)); } catch (e) { next(e); }
};

exports.follow    = act(svc.follow,    'Following');
exports.unfollow  = act(svc.unfollow,  'Unfollowed');
exports.block     = act(svc.block,     'Blocked');
exports.unblock   = act(svc.unblock,   'Unblocked');
exports.following = read(svc.listFollowing);
exports.followers = read(svc.listFollowers);
exports.blocked   = read(svc.listBlocked);
exports.relationship = read(svc.relationship);

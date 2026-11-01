const svc = require('../services/resource.service');
const { ok, created, forbidden } = require('../utils/response');

exports.list = async (req, res, next) => { try { return ok(res, await svc.list()); } catch (e) { next(e); } };

// Admin-only (ADMIN_USERNAMES)
exports.create = async (req, res, next) => {
  try {
    if (!svc.isAdmin(req.user)) return forbidden(res, 'Admins only');
    return created(res, await svc.create(req.body), 'Resource added');
  } catch (e) { next(e); }
};

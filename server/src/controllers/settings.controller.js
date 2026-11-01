const svc = require('../services/settings.service');
const { ok } = require('../utils/response');

exports.get    = async (req, res, next) => { try { return ok(res, await svc.get(req.user.id)); } catch (e) { next(e); } };
exports.update = async (req, res, next) => { try { return ok(res, await svc.update(req.user.id, req.body), 'Settings saved'); } catch (e) { next(e); } };

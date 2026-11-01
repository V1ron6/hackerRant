const svc = require('../services/status.service');
const { ok, created } = require('../utils/response');

exports.list   = async (req, res, next) => { try { return ok(res, await svc.list()); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { return created(res, await svc.create(req.user.id, req.body), 'Posted'); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { await svc.remove(req.user.id, req.params.id); return ok(res, {}, 'Deleted'); } catch (e) { next(e); } };

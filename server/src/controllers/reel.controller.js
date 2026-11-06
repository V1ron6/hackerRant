const svc = require('../services/reel.service');
const { ok, created } = require('../utils/response');

exports.feed   = async (req, res, next) => { try { return ok(res, await svc.feed(req.user.id, req.query)); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { return created(res, await svc.create(req.user.id, req.body), 'Posted'); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { await svc.remove(req.user.id, req.params.id); return ok(res, {}, 'Deleted'); } catch (e) { next(e); } };
exports.like   = async (req, res, next) => { try { return ok(res, await svc.like(req.user.id, req.params.id)); } catch (e) { next(e); } };
exports.unlike = async (req, res, next) => { try { return ok(res, await svc.unlike(req.user.id, req.params.id)); } catch (e) { next(e); } };

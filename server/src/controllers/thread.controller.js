const svc = require('../services/thread.service');
const { ok, created } = require('../utils/response');

exports.list   = async (req, res, next) => { try { return ok(res, await svc.list({ cursor: req.query.cursor })); } catch (e) { next(e); } };
exports.get    = async (req, res, next) => { try { return ok(res, await svc.get(req.params.id)); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { return created(res, await svc.create(req.user.id, req.body), 'Thread created'); } catch (e) { next(e); } };
exports.reply  = async (req, res, next) => { try { return created(res, await svc.reply(req.user.id, req.params.id, req.body.body), 'Reply posted'); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { await svc.remove(req.user, req.params.id); return ok(res, {}, 'Deleted'); } catch (e) { next(e); } };

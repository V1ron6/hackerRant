const svc = require('../services/complaint.service');
const { ok, created } = require('../utils/response');

exports.list   = async (req, res, next) => { try { return ok(res, await svc.listMine(req.user.id)); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { return created(res, await svc.create(req.user.id, req.body), 'Complaint submitted'); } catch (e) { next(e); } };

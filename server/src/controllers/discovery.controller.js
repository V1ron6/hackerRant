const svc = require('../services/discovery.service');
const { ok } = require('../utils/response');

exports.search = async (req, res, next) => { try { return ok(res, await svc.search(req.user.id, req.query.q)); } catch (e) { next(e); } };
exports.nearby = async (req, res, next) => {
  try {
    const { lat, lng, radiusKm } = req.query;
    return ok(res, await svc.nearby(req.user, Number(lat), Number(lng), Number(radiusKm) || 25));
  } catch (e) { next(e); }
};

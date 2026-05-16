const sessionService    = require('../services/session.service');
const { ok, serverError } = require('../utils/response');

// GET /api/sessions
exports.listSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.id);
    return ok(res, sessions);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/sessions/:id
exports.revokeSession = async (req, res, next) => {
  try {
    await sessionService.revokeSession(req.params.id, req.user.id);
    return ok(res, {}, 'Session revoked');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/sessions
exports.revokeAll = async (req, res, next) => {
  try {
    await sessionService.revokeAllSessions(req.user.id);
    res.clearCookie('hr_ticket', { sameSite: 'none', secure: true });
    return ok(res, {}, 'All sessions revoked');
  } catch (err) {
    next(err);
  }
};

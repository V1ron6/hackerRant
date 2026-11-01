const bcrypt           = require('bcryptjs');
const crypto           = require('crypto');
const { User }         = require('../models');
const { ok, notFound, forbidden } = require('../utils/response');
const king             = require('../middleware/security/king');
const settingsService  = require('../services/settings.service');
const sessionService   = require('../services/session.service');
const auditService     = require('../services/audit.service');
const storage          = require('../services/storage.service');
const httpError        = require('../utils/httpError');

// GET /api/users/:username
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where:      { username: String(req.params.username).toLowerCase(), status: 'active' },
      attributes: ['id', 'username', 'first_name', 'last_name', 'bio', 'avatar_url', 'created_at'],
    });

    if (!user) return notFound(res, 'User not found');

    // Sanitize bio on output
    const data = user.toJSON();
    data.bio   = king(data.bio);

    return ok(res, data);
  } catch (err) {
    next(err);
  }
};

const round2 = (n) => Math.round(Number(n) * 100) / 100; // ~1 km: never store a precise position

// PATCH /api/users/me
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['first_name', 'last_name', 'bio', 'dob', 'avatar_url', 'latitude', 'longitude'];
    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field] === '' ? null : req.body[field];
      }
    }

    if (updates.avatar_url && !storage.isOwnUrl(updates.avatar_url)) {
      throw httpError(400, 'Upload the picture first, then save it');
    }

    if (updates.latitude != null || updates.longitude != null) {
      if (updates.latitude == null || updates.longitude == null) {
        throw httpError(400, 'Send both latitude and longitude');
      }
      const settings = await settingsService.load(req.user.id);
      if (!settings.share_location) throw httpError(403, 'Turn on location sharing in Settings first');
      updates.latitude  = round2(updates.latitude);
      updates.longitude = round2(updates.longitude);
    }

    await User.update(updates, { where: { id: req.user.id } });

    const fresh = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
    return ok(res, fresh, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/me   { password }
// Scrubs personal data and frees the username/email; ends every session and socket.
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!(await bcrypt.compare(String(req.body.password || ''), user.password_hash))) {
      return forbidden(res, 'Incorrect password');
    }

    const tag = user.id.replace(/-/g, '').slice(0, 12);
    await User.update({
      status:        'deleted',
      username:      `deleted_${tag}`,
      email:         `deleted-${tag}@deleted.invalid`,
      phone:         `del${tag}`,
      password_hash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 4),
      first_name: null, last_name: null, bio: null, dob: null,
      avatar_url: null, latitude: null, longitude: null,
    }, { where: { id: user.id } });

    await sessionService.revokeAllSessions(user.id);
    await auditService.log(user.id, 'ACCOUNT_DELETE', { ip: req.ip });

    try { require('../sockets').getIO().in(user.id).disconnectSockets(true); } catch { /* sockets not initialised */ }

    res.clearCookie('hr_ticket', { sameSite: 'none', secure: true });
    return ok(res, {}, 'Account deleted');
  } catch (err) {
    next(err);
  }
};

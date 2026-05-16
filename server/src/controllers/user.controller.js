const { User }      = require('../models');
const { ok, notFound } = require('../utils/response');
const king          = require('../middleware/security/king');

// GET /api/users/:username
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where:      { username: req.params.username, status: 'active' },
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

// PATCH /api/users/me
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['first_name', 'last_name', 'bio', 'dob'];
    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await User.update(updates, { where: { id: req.user.id } });

    return ok(res, {}, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

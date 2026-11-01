const { Op, QueryTypes } = require('sequelize');
const { sequelize, User } = require('../models');
const settingsService     = require('./settings.service');
const httpError           = require('../utils/httpError');

// ─── Username prefix search ──────────────────────────────────────────────────
exports.search = async (meId, q) => {
  const term = String(q || '').toLowerCase().replace(/[^a-z0-9_]/g, ''); // also neutralises LIKE wildcards
  if (term.length < 2) throw httpError(400, 'Type at least 2 characters');

  return User.findAll({
    where: {
      username:       { [Op.like]: `${term}%` },
      status:         'active',
      email_verified: true,
      id:             { [Op.ne]: meId },
    },
    attributes: ['username', 'first_name', 'last_name', 'avatar_url'],
    order:      [['username', 'ASC']],
    limit:      20,
  });
};

// ─── People near me (opt-in on BOTH sides; coordinates are never returned) ───
exports.nearby = async (me, lat, lng, radiusKm) => {
  const mine = await settingsService.load(me.id);
  if (!mine.share_location) {
    throw httpError(403, 'Turn on location sharing in Settings to find people nearby');
  }

  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

  const rows = await sequelize.query(
    `SELECT * FROM (
       SELECT u.username, u.first_name, u.last_name, u.avatar_url,
              6371 * acos(LEAST(1,
                cos(radians(:lat)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians(:lng))
                + sin(radians(:lat)) * sin(radians(u.latitude)))) AS distance_km
         FROM users u
         JOIN user_settings s ON s.user_id = u.id
        WHERE s.share_location = TRUE
          AND u.status = 'active' AND u.email_verified = TRUE
          AND u.id <> :me
          AND u.latitude  BETWEEN :minLat AND :maxLat
          AND u.longitude BETWEEN :minLng AND :maxLng
     ) t
     WHERE distance_km <= :radius
     ORDER BY distance_km ASC
     LIMIT 50`,
    {
      type: QueryTypes.SELECT,
      replacements: {
        me: me.id, lat, lng, radius: radiusKm,
        minLat: lat - dLat, maxLat: lat + dLat,
        minLng: lng - dLng, maxLng: lng + dLng,
      },
    }
  );

  return rows.map((r) => ({
    username:   r.username,
    first_name: r.first_name,
    last_name:  r.last_name,
    avatar_url: r.avatar_url,
    distanceKm: Math.max(1, Math.ceil(Number(r.distance_km))), // coarse on purpose
  }));
};

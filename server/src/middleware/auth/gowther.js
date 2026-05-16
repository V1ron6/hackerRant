const { Session }     = require('../../models');
const fingerprint     = require('../../utils/fingerprint');
const { unauthorized } = require('../../utils/response');

// Run AFTER authenticate. Checks that the current fingerprint
// matches the session on record.
module.exports = async (req, res, next) => {
  try {
    const currentFp = fingerprint(req);

    const session = await Session.findOne({
      where: {
        user_id:    req.user.id,
        fingerprint: req.fingerprint,
        is_revoked:  false,
      },
    });

    if (!session || session.fingerprint !== currentFp) {
      // Revoke the anomalous session
      if (session) {
        session.is_revoked = true;
        await session.save();
      }

      return unauthorized(res, 'GOWTHER: Session anomaly detected');
    }

    next();
  } catch (err) {
    next(err);
  }
};

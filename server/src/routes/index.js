const router = require('express').Router();

router.use('/auth',     require('./auth.routes'));
router.use('/users',    require('./user.routes'));
router.use('/sessions', require('./session.routes'));
router.use('/chats',    require('./chat.routes'));

module.exports = router;

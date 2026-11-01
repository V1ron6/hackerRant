const router = require('express').Router();

router.use('/auth',     require('./auth.routes'));
router.use('/users',    require('./user.routes'));
router.use('/sessions', require('./session.routes'));
router.use('/chats',    require('./chat.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/discovery', require('./discovery.routes'));
router.use('/uploads',  require('./upload.routes'));
router.use('/status',   require('./status.routes'));
router.use('/threads',  require('./thread.routes'));
router.use('/resources', require('./resource.routes'));
router.use('/complaints', require('./complaint.routes'));

module.exports = router;

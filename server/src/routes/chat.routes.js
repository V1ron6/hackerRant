const router       = require('express').Router();
const { body, param } = require('express-validator');
const chatCtrl     = require('../controllers/chat.controller');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const ban          = require('../middleware/validation/ban');

const chatId = param('chatId').isUUID().withMessage('Invalid chat id');

router.use(authenticate);

router.get('/', chatCtrl.list);

router.post('/',
  merlin.verifyToken,
  body('username').trim().matches(/^[a-zA-Z0-9_]{3,30}$/).withMessage('Invalid username'),
  ban, chatCtrl.create);

router.get('/:chatId/messages', chatId, ban, chatCtrl.messages);

router.post('/:chatId/messages',
  merlin.verifyToken, chatId,
  body('text').isString().withMessage('text is required'),
  ban, chatCtrl.send);

router.post('/:chatId/read', merlin.verifyToken, chatId, ban, chatCtrl.read);

module.exports = router;

const multer        = require('multer');
const uploadService = require('../services/upload.service');
const { created }   = require('../utils/response');
const httpError     = require('../utils/httpError');

const single = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 25 * 1024 * 1024, files: 1, fields: 4 },
}).single('file');

// POST /api/uploads   multipart: file (+ optional purpose=avatar)
exports.upload = (req, res, next) => {
  single(req, res, async (err) => {
    try {
      if (err) {
        throw err.code === 'LIMIT_FILE_SIZE'
          ? httpError(413, 'File too large (max 25 MB)')
          : httpError(400, 'Invalid upload');
      }
      if (!req.file) throw httpError(400, 'No file provided (field name: file)');

      const result = await uploadService.process(req.file.buffer, { avatar: req.body?.purpose === 'avatar' });
      return created(res, result, 'Uploaded');
    } catch (e) {
      next(e);
    }
  });
};

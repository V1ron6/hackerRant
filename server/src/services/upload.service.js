const sharp       = require('sharp');
const sniff       = require('../utils/sniff');
const storage     = require('./storage.service');
const httpError   = require('../utils/httpError');

const MB = 1024 * 1024;
const LIMITS = { image: 5 * MB, audio: 15 * MB, video: 25 * MB };

// Validate by content, re-encode images (drops EXIF/GPS and any polyglot payload), store.
exports.process = async (buffer, { avatar = false } = {}) => {
  const type = sniff(buffer);
  if (!type) throw httpError(400, 'Unsupported file type (images, mp4/webm video, mp3/ogg/wav/m4a audio)');
  if (buffer.length > LIMITS[type.kind]) {
    throw httpError(413, `${type.kind} too large (max ${LIMITS[type.kind] / MB} MB)`);
  }
  if (avatar && type.kind !== 'image') throw httpError(400, 'Avatar must be an image');

  let out = buffer;
  let { ext, mime } = type;

  if (type.kind === 'image') {
    try {
      let img = sharp(buffer, { animated: !avatar, limitInputPixels: 40e6 }).rotate();
      img = avatar
        ? img.resize(256, 256, { fit: 'cover' })
        : img.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true });
      out = await img.webp({ quality: 82 }).toBuffer();
      ext = 'webp';
      mime = 'image/webp';
    } catch {
      throw httpError(400, 'Invalid or corrupt image');
    }
  }

  const { url } = await storage.save(out, { ext, mime });
  return { url, kind: type.kind };
};

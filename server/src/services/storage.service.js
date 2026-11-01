const crypto = require('crypto');
const fs     = require('fs/promises');
const path   = require('path');

const driver = () => (process.env.STORAGE_DRIVER || 'local').toLowerCase();

exports.UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Base URL every stored file lives under (no trailing slash).
const base = () =>
  driver() === 'r2'
    ? String(process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')
    : `${String(process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/+$/, '')}/uploads`;

let s3;
const r2Client = () => {
  if (!s3) {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3 = new S3Client({
      region:   'auto',
      endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      forcePathStyle: process.env.R2_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId:     process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3;
};

// Persist a (already validated/re-encoded) buffer under a random key. Returns its public URL.
exports.save = async (buffer, { ext, mime }) => {
  const key = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;

  if (driver() === 'r2') {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await r2Client().send(new PutObjectCommand({
      Bucket:       process.env.R2_BUCKET,
      Key:          key,
      Body:         buffer,
      ContentType:  mime,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
  } else {
    const file = path.join(exports.UPLOAD_DIR, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buffer, { flag: 'wx' });
  }

  return { key, url: `${base()}/${key}` };
};

// Only URLs we issued may be attached to avatars/posts (blocks javascript:, tracking pixels, etc.).
exports.isOwnUrl = (url) => {
  if (typeof url !== 'string' || !url) return false;
  const prefix = `${base()}/`;
  if (!url.startsWith(prefix)) return false;
  return /^\d{4}-\d{2}\/[0-9a-f-]{36}\.[a-z0-9]{2,4}$/.test(url.slice(prefix.length));
};

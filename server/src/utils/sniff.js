// Identify an upload from its leading bytes. The client-supplied mimetype and
// filename are ignored entirely — they are attacker-controlled.
const ascii = (buf, from, to) => buf.toString('latin1', from, to);

module.exports = (buf) => {
  if (!buf || buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)                           return { kind: 'image', ext: 'jpg',  mime: 'image/jpeg' };
  if (buf[0] === 0x89 && ascii(buf, 1, 4) === 'PNG' && buf[4] === 0x0d)                return { kind: 'image', ext: 'png',  mime: 'image/png' };
  if (ascii(buf, 0, 4) === 'GIF8')                                                      return { kind: 'image', ext: 'gif',  mime: 'image/gif' };
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 12) === 'WEBP')                      return { kind: 'image', ext: 'webp', mime: 'image/webp' };
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 12) === 'WAVE')                      return { kind: 'audio', ext: 'wav',  mime: 'audio/wav' };
  if (ascii(buf, 4, 8) === 'ftyp') {
    return ascii(buf, 8, 12) === 'M4A '
      ? { kind: 'audio', ext: 'm4a', mime: 'audio/mp4' }
      : { kind: 'video', ext: 'mp4', mime: 'video/mp4' };
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3)         return { kind: 'video', ext: 'webm', mime: 'video/webm' };
  if (ascii(buf, 0, 4) === 'OggS')                                                      return { kind: 'audio', ext: 'ogg',  mime: 'audio/ogg' };
  if (ascii(buf, 0, 3) === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0))      return { kind: 'audio', ext: 'mp3',  mime: 'audio/mpeg' };

  return null;
};

const crypto = require('crypto');

// Express sets req.ip (honouring `trust proxy`); a raw Socket.io handshake
// request does not. Fall back to the same value Express would derive with
// `trust proxy = 1`: the last X-Forwarded-For entry, else the socket address.
// Without this, socket fingerprints never match the ones issued over HTTP.
const clientIp = (req) => {
  if (req.ip) return req.ip;
  const xff = req.headers?.['x-forwarded-for'];
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.socket?.remoteAddress || '';
};

// Coarse network prefix, stable across normal IP churn (buildi.txt: bound to IP,
// but a strict match locks people out on mobile/dynamic networks).
//   IPv4 (incl. ::ffff:a.b.c.d) -> first two octets   "41.202"
//   IPv6                        -> first two hextets  "2001:db8"
// The old code split on '.', so any native IPv6 address was used in full and
// changed on practically every reconnect.
const partialIp = (req) => {
  let ip = String(clientIp(req) || '').trim().toLowerCase();
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    return ip.split('.').slice(0, 2).join('.');
  }

  if (ip.includes(':')) {
    const [head] = ip.split('::');               // hextets before any '::'
    const groups = head.split(':').filter(Boolean);
    while (groups.length < 2) groups.push('0');
    return groups.slice(0, 2).map((g) => g.replace(/^0+(?=.)/, '')).join(':');
  }

  return ip;
};

// Browser/OS family only. The raw User-Agent changes with every browser update
// (Chrome ships roughly monthly) and OS upgrade, which silently invalidated
// 90-day tickets. Versions are deliberately ignored.
const deviceClass = (ua = '') => {
  const browser =
    /edg(e|a|ios)?\//i.test(ua)   ? 'edge'    :
    /opr\/|opera/i.test(ua)       ? 'opera'   :
    /firefox|fxios/i.test(ua)     ? 'firefox' :
    /samsungbrowser/i.test(ua)    ? 'samsung' :
    /chrome|crios|chromium/i.test(ua) ? 'chrome' :
    /safari/i.test(ua)            ? 'safari'  : 'other';

  const os =
    /android/i.test(ua)                 ? 'android' :
    /iphone|ipad|ipod/i.test(ua)        ? 'ios'     :
    /windows/i.test(ua)                 ? 'windows' :
    /cros/i.test(ua)                    ? 'chromeos':
    /mac os x|macintosh/i.test(ua)      ? 'macos'   :
    /linux|x11/i.test(ua)               ? 'linux'   : 'other';

  return `${browser}|${os}`;
};

// Device fingerprint = browser/OS family only. The network prefix is NOT part of
// it: it's tracked per ticket (see ticket.service) and may drift without
// invalidating the ticket.
const fingerprint = (req) =>
  crypto.createHash('sha256').update(deviceClass(req.headers?.['user-agent'] || '')).digest('hex');

module.exports = fingerprint;
module.exports.partialIp = partialIp;
module.exports.deviceClass = deviceClass;

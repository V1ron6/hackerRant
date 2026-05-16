const xss = require('xss');

// Use this on output, NOT on input storage.
// Raw content is stored in DB; sanitize only when sending to client.
module.exports = (content) => {
  if (typeof content !== 'string') return content;
  return xss(content);
};

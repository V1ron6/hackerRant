exports.ok = (res, data = {}, message = 'OK') => {
  return res.status(200).json({ success: true, message, data });
};

exports.created = (res, data = {}, message = 'Created') => {
  return res.status(201).json({ success: true, message, data });
};

exports.badRequest = (res, message = 'Bad request') => {
  return res.status(400).json({ success: false, error: message });
};

exports.unauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({ success: false, error: message });
};

exports.forbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({ success: false, error: message });
};

exports.notFound = (res, message = 'Not found') => {
  return res.status(404).json({ success: false, error: message });
};

exports.serverError = (res, message = 'Internal server error') => {
  return res.status(500).json({ success: false, error: message });
};

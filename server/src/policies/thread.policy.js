exports.canReplyToThread = (user, thread) => {
  return thread.is_open !== false;
};

exports.canDeleteThread = (user, thread) => {
  return user.id === thread.owner_id;
};

exports.canPinThread = (user) => {
  return user.role === 'admin' || user.role === 'moderator';
};

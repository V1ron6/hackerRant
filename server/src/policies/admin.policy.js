exports.canSuspendUser = (actor) => {
  return actor.role === 'admin';
};

exports.canViewAuditLogs = (actor) => {
  return actor.role === 'admin';
};

exports.canDeleteAnyMessage = (actor) => {
  return actor.role === 'admin' || actor.role === 'moderator';
};

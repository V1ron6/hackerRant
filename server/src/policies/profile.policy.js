exports.canEditProfile = (user, targetUserId) => {
  return user.id === targetUserId;
};

exports.canViewFullProfile = (user, targetUser) => {
  return (
    user.id === targetUser.id ||
    targetUser.status === 'active'
  );
};

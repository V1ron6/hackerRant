exports.canDeleteMessage = (user, message) => {
  return user.id === message.sender_id;
};

exports.canEditMessage = (user, message) => {
  return user.id === message.sender_id;
};

exports.canViewMessage = (user, message) => {
  return (
    user.id === message.sender_id ||
    user.id === message.recipient_id
  );
};

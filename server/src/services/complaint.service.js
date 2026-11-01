const { Complaint } = require('../models');

exports.create = async (userId, { subject, message }) =>
  Complaint.create({ user_id: userId, subject: subject.trim(), message: message.trim() });

exports.listMine = (userId) =>
  Complaint.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']], limit: 50 });

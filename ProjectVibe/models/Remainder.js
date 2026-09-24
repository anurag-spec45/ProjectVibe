const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emailNotifications: { type: Boolean, default: true },
  alert24h: { type: Boolean, default: true },
  friendActivityDigest: { type: Boolean, default: true }
});

module.exports = mongoose.model('Reminder', ReminderSchema);
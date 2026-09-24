const mongoose = require('mongoose');

const RSVPSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  eventDate: { type: String, required: true },
  venue: { type: String, required: true },
  friendsAttending: { type: Number, default: 0 },
  inviteCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RSVP', RSVPSchema);
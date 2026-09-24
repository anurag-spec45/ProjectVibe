const express = require('express');
const router = express.Router();
const RSVP = require('../models/RSVP');

// GET All Confirmed RSVPs for a User
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const rsvps = await RSVP.find({ userId }).sort({ createdAt: -1 });
    res.json(rsvps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve RSVPs.' });
  }
});

// CREATE a New RSVP
router.post('/', async (req, res) => {
  try {
    const { userId, eventId, eventTitle, eventDate, venue } = req.body;

    // Check if user already RSVP'd to this event
    let existingRSVP = await RSVP.findOne({ userId, eventId });
    if (existingRSVP) {
      return res.status(400).json({ message: 'You have already RSVP’d to this event.' });
    }

    // Generate unique share code for the Vibe Check invite system
    const inviteCode = `vibe-${Math.random().toString(36).substring(2, 7)}`;

    const newRSVP = await RSVP.create({
      userId: userId || "650000000000000000000001",
      eventId,
      eventTitle,
      eventDate,
      venue,
      inviteCode
    });

    res.status(201).json({
      message: 'RSVP confirmed successfully!',
      rsvp: newRSVP
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process RSVP.' });
  }
});

// CANCEL an RSVP
router.delete('/:id', async (req, res) => {
  try {
    await RSVP.findByIdAndDelete(req.params.id);
    res.json({ message: 'RSVP cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel RSVP.' });
  }
});

module.exports = router;
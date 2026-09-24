const express = require('express');
const router = express.Router();
const RSVP = require('../models/RSVP');

// Track referral click & increment "Friends Attending" count
router.get('/:inviteCode', async (req, res) => {
  const { inviteCode } = req.params;

  try {
    const rsvp = await RSVP.findOne({ inviteCode });
    if (rsvp) {
      rsvp.friendsAttending += 1;
      await rsvp.save();
      return res.redirect(`/?invitedBy=${inviteCode}&eventId=${rsvp.eventId}`);
    }
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error tracking invite referral.');
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Reminder = require('../models/Remainder');

// GET User Profile & Reminder Settings
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let user = await User.findById(userId);
    
    // If demo user doesn't exist yet, return default data
    if (!user) {
      user = {
        _id: userId,
        name: 'Demo User',
        email: 'user@example.com',
        location: 'New York, NY'
      };
    }

    let reminder = await Reminder.findOne({ userId });
    if (!reminder) {
      reminder = {
        emailNotifications: true,
        alert24h: true,
        friendActivityDigest: true
      };
    }

    res.json({ user, reminder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile data.' });
  }
});

// UPDATE User Profile & Reminder Settings
router.post('/update', async (req, res) => {
  try {
    const { userId, name, email, location, emailNotifications, alert24h, friendActivityDigest } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, location },
      { new: true, upsert: true }
    );

    const reminder = await Reminder.findOneAndUpdate(
      { userId },
      { emailNotifications, alert24h, friendActivityDigest },
      { new: true, upsert: true }
    );

    res.json({ message: 'Profile updated successfully!', user, reminder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
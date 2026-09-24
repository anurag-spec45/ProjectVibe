const express = require('express');
const router = express.Router();
const axios = require('axios');

// Fetch Event Listings from Ticketmaster API
router.get('/', async (req, res) => {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  const city = req.query.city || 'New York';

  if (!apiKey) {
    // Fallback Mock Data if API Key is not set
    return res.json([
      { id: 'TM-101', title: 'Neon Dreams Festival', venue: 'Brooklyn Mirage', date: '2026-10-15', time: '20:00', category: 'Music' },
      { id: 'TM-102', title: 'Tech Innovators Summit', venue: 'Javits Center', date: '2026-10-18', time: '09:00', category: 'Tech' }
    ]);
  }

  try {
    const response = await axios.get(`https://app.ticketmaster.com/discovery/v2/events.json?city=${city}&apikey=${apiKey}`);
    const rawEvents = response.data._embedded?.events || [];

    const formattedEvents = rawEvents.map(evt => ({
      id: evt.id,
      title: evt.name,
      venue: evt._embedded?.venues?.[0]?.name || 'TBD Venue',
      date: evt.dates?.start?.localDate,
      time: evt.dates?.start?.localTime || '19:00',
      category: evt.classifications?.[0]?.segment?.name || 'General',
      image: evt.images?.[0]?.url
    }));

    res.json(formattedEvents);
  } catch (error) {
    res.status(500).json({ error: 'Failed fetching Ticketmaster events' });
  }
});

module.exports = router;
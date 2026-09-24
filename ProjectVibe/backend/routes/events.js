const express = require("express");
const Event = require("../models/Event");
const Rsvp = require("../models/Rsvp");
const Invite = require("../models/Invite");
const { fetchEvents } = require("../services/ticketmaster");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// GET /api/events/search?city=Delhi&keyword=music&start=2026-10-01&end=2026-10-31
// Pulls fresh results from Ticketmaster, upserts them into Mongo so every
// event has a stable local _id, and returns the cached local docs.
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const { city, keyword, start, end } = req.query;
    const events = await fetchEvents({
      city,
      keyword,
      startDateTime: start ? `${start}T00:00:00Z` : undefined,
      endDateTime: end ? `${end}T23:59:59Z` : undefined,
    });

    const saved = await Promise.all(
      events
        .filter((e) => e.date) // skip events with no resolvable date
        .map((e) =>
          Event.findOneAndUpdate({ ticketmasterId: e.ticketmasterId }, e, {
            upsert: true,
            new: true,
          })
        )
    );

    res.json(saved);
  })
);

// GET /api/events/calendar?month=2026-10
// Returns events grouped by ISO date, for painting the calendar grid.
router.get(
  "/calendar",
  asyncHandler(async (req, res) => {
    const { month } = req.query; // "YYYY-MM"
    if (!month) return res.status(400).json({ error: "month=YYYY-MM is required" });

    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const events = await Event.find({ date: { $gte: start, $lt: end } }).sort("date");

    const byDate = {};
    for (const ev of events) {
      const key = ev.date.toISOString().slice(0, 10);
      (byDate[key] = byDate[key] || []).push(ev);
    }
    res.json(byDate);
  })
);

// GET /api/events/:id  -> single event with friends-attending count
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const goingCount = await Rsvp.countDocuments({ event: event._id, status: { $in: ["interested", "going"] } });
    const invites = await Invite.find({ event: event._id });
    const friendsAttending = invites.reduce((sum, inv) => sum + inv.clickedBy.length, 0);

    res.json({ ...event.toObject(), goingCount, friendsAttending });
  })
);

module.exports = router;

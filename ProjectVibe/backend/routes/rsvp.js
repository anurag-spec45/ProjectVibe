const express = require("express");
const Rsvp = require("../models/Rsvp");
const Event = require("../models/Event");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// POST /api/rsvp  { userId, eventId, status }
// Powers the "Interested" button on an event card.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { userId, eventId, status = "interested" } = req.body;
    if (!userId || !eventId) return res.status(400).json({ error: "userId and eventId are required" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const rsvp = await Rsvp.findOneAndUpdate(
      { user: userId, event: eventId },
      { status },
      { upsert: true, new: true }
    );

    req.io?.emit("rsvp:updated", { eventId, userId, status });
    res.json(rsvp);
  })
);

// GET /api/rsvp/dashboard/:userId
// All confirmed event attendance for a user, most recent first, for the
// "RSVP Dashboard" screen.
router.get(
  "/dashboard/:userId",
  asyncHandler(async (req, res) => {
    const rsvps = await Rsvp.find({
      user: req.params.userId,
      status: { $in: ["interested", "going"] },
    })
      .populate("event")
      .sort({ "event.date": 1 });

    res.json(rsvps);
  })
);

// DELETE /api/rsvp/:id  -> cancel an RSVP
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await Rsvp.findByIdAndUpdate(req.params.id, { status: "cancelled" });
    res.json({ ok: true });
  })
);

module.exports = router;

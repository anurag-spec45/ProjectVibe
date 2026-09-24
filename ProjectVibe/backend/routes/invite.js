const express = require("express");
const { nanoid } = require("nanoid");
const Invite = require("../models/Invite");
const Rsvp = require("../models/Rsvp");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// POST /api/invite  { userId, eventId }
// Only allowed once the user has RSVP'd - generates a shareable link.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { userId, eventId } = req.body;
    if (!userId || !eventId) return res.status(400).json({ error: "userId and eventId are required" });

    const hasRsvpd = await Rsvp.findOne({ user: userId, event: eventId, status: { $in: ["interested", "going"] } });
    if (!hasRsvpd) {
      return res.status(403).json({ error: "You must RSVP before generating a share link" });
    }

    const code = nanoid(8);
    const invite = await Invite.create({ code, event: eventId, createdBy: userId });

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    res.json({ ...invite.toObject(), shareUrl: `${baseUrl}/api/invite/${code}` });
  })
);

// GET /api/invite/:code
// The link a friend actually clicks. Tracks the click (de-duplicated by
// a client fingerprint), bumps "Friends Attending" in real time, then
// redirects to the event so it still works as a normal shareable link.
router.get(
  "/:code",
  asyncHandler(async (req, res) => {
    const invite = await Invite.findOne({ code: req.params.code }).populate("event");
    if (!invite) return res.status(404).json({ error: "Invite link not found" });

    const fingerprint = req.query.uid || req.ip;
    if (!invite.clickedBy.includes(fingerprint)) {
      invite.clickedBy.push(fingerprint);
      invite.clicks += 1;
      await invite.save();

      req.io?.emit("invite:clicked", {
        eventId: invite.event._id,
        friendsAttending: invite.clickedBy.length,
      });
    }

    const clientUrl = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    res.redirect(`${clientUrl}/?event=${invite.event._id}&via=${req.params.code}`);
  })
);

// GET /api/invite/stats/:eventId  -> friends-attending count for an event
router.get(
  "/stats/:eventId",
  asyncHandler(async (req, res) => {
    const invites = await Invite.find({ event: req.params.eventId });
    const friendsAttending = invites.reduce((sum, inv) => sum + inv.clickedBy.length, 0);
    const totalClicks = invites.reduce((sum, inv) => sum + inv.clicks, 0);
    res.json({ friendsAttending, totalClicks, linksGenerated: invites.length });
  })
);

module.exports = router;

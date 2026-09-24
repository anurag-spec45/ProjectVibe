const express = require("express");
const { handleChatMessage } = require("../sockets/chatSocket");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// POST /api/chat  { message, userId }
// A REST fallback for the same intent-parsing logic the socket uses,
// so the chat also works without a live websocket connection.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { message, userId } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const reply = await handleChatMessage({ message, userId });
    res.json(reply);
  })
);

module.exports = router;

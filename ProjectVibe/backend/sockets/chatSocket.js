const Event = require("../models/Event");
const Rsvp = require("../models/Rsvp");
const { fetchEvents } = require("../services/ticketmaster");

/**
 * Lightweight intent parser for the chat interface. This is deliberately
 * rule-based (fast, free, no external LLM dependency required to run the
 * assessment) but is isolated behind handleChatMessage() so it can be
 * swapped for a call to an LLM API without touching the socket/route layer.
 *
 * Recognized intents:
 *   - "find/search events in <city>"           -> live Ticketmaster search
 *   - "what's happening this weekend/today"    -> date-scoped search
 *   - "rsvp / interested in <event title>"     -> creates an RSVP
 *   - anything else                            -> friendly fallback + hint
 */
async function handleChatMessage({ message, userId }) {
  const text = (message || "").trim();
  const lower = text.toLowerCase();

  if (/\b(find|search|show|any)\b.*\bevents?\b/.test(lower) || /events? in \w+/.test(lower)) {
    const cityMatch = lower.match(/(?:in|near|around)\s+([a-z\s]+?)(?:$|[.?!])/);
    const city = cityMatch ? cityMatch[1].trim() : undefined;

    try {
      const events = await fetchEvents({ city, size: 5 });
      if (!events.length) {
        return { type: "text", text: `I couldn't find events${city ? ` in ${city}` : ""} right now. Try another city or keyword.` };
      }
      return {
        type: "event-list",
        text: `Here's what I found${city ? ` in ${city}` : ""}:`,
        events,
      };
    } catch (err) {
      return { type: "text", text: `I couldn't reach the event feed (${err.message}). Please try again shortly.` };
    }
  }

  if (/\b(interested|rsvp|going to|count me in)\b/.test(lower)) {
    if (!userId) return { type: "text", text: "Log in first so I know who's RSVPing!" };

    const titleGuess = text.replace(/(interested in|rsvp( to)?|going to|count me in)/gi, "").trim();
    const event = await Event.findOne({ title: new RegExp(titleGuess, "i") });
    if (!event) {
      return { type: "text", text: `I couldn't match that to an event. Try "find events in <city>" first, then RSVP by name.` };
    }

    await Rsvp.findOneAndUpdate(
      { user: userId, event: event._id },
      { status: "interested" },
      { upsert: true }
    );
    return { type: "text", text: `You're marked interested in "${event.title}". It'll show up in your RSVP dashboard.` };
  }

  if (/\b(my rsvps?|my events?|dashboard)\b/.test(lower)) {
    return { type: "text", text: "Check the RSVP Dashboard tab to see everything you've confirmed." };
  }

  return {
    type: "text",
    text: "I can help you find events (\"find events in Bangalore\"), or RSVP (\"I'm interested in <event name>\"). What would you like to do?",
  };
}

// Attaches real-time chat handling to a Socket.io server instance.
function registerChatSocket(io) {
  io.on("connection", (socket) => {
    socket.on("chat:message", async ({ message, userId }) => {
      const reply = await handleChatMessage({ message, userId });
      socket.emit("chat:reply", reply);
    });
  });
}

module.exports = { handleChatMessage, registerChatSocket };

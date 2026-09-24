// Small fetch wrapper for the backend REST API.
const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

// In a real app this comes from auth; for the assessment demo we fake a
// stable local user so RSVPs/invites can be exercised end-to-end.
const CURRENT_USER_ID = localStorage.getItem("vibe_user_id") || null;

const Api = {
  async getCalendar(month) {
    const res = await fetch(`${API_BASE}/events/calendar?month=${month}`);
    return res.json();
  },
  async searchEvents(city) {
    const res = await fetch(`${API_BASE}/events/search?city=${encodeURIComponent(city)}`);
    return res.json();
  },
  async getEvent(id) {
    const res = await fetch(`${API_BASE}/events/${id}`);
    return res.json();
  },
  async rsvp(userId, eventId, status = "interested") {
    const res = await fetch(`${API_BASE}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, eventId, status }),
    });
    return res.json();
  },
  async getDashboard(userId) {
    const res = await fetch(`${API_BASE}/rsvp/dashboard/${userId}`);
    return res.json();
  },
  async createInvite(userId, eventId) {
    const res = await fetch(`${API_BASE}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, eventId }),
    });
    return res.json();
  },
  async chatFallback(message, userId) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId }),
    });
    return res.json();
  },
};

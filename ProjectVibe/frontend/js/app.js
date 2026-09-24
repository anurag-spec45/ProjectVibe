// Builds event cards from the <template> and wires Interested/Share
// buttons to the backend. Shared by the calendar panel, the dashboard,
// and chat event results.
const EventCards = (() => {
  function renderList(container, events) {
    container.innerHTML = "";
    if (!events.length) {
      container.innerHTML = `<p style="color:var(--muted)">No events here yet.</p>`;
      return;
    }
    events.forEach((ev) => container.appendChild(buildCard(ev)));
  }

  function buildCard(ev) {
    const tpl = document.getElementById("eventCardTemplate").content.cloneNode(true);
    const card = tpl.querySelector(".event-card");
    card.dataset.eventId = ev._id;

    tpl.querySelector(".event-img").src = ev.imageUrl || "https://placehold.co/120x120?text=Event";
    tpl.querySelector(".event-title").textContent = ev.title;
    tpl.querySelector(".event-meta").textContent =
      `${ev.venue} • ${new Date(ev.date).toLocaleDateString()} ${ev.time || ""}`.trim();
    tpl.querySelector(".event-friends").textContent = ev.friendsAttending
      ? `🎉 ${ev.friendsAttending} friend${ev.friendsAttending > 1 ? "s" : ""} attending`
      : "";

    const interestedBtn = tpl.querySelector(".interested-btn");
    interestedBtn.addEventListener("click", async () => {
      if (!CURRENT_USER_ID) return alert("Demo mode: set a user id in localStorage as vibe_user_id to RSVP.");
      await Api.rsvp(CURRENT_USER_ID, ev._id, "interested");
      interestedBtn.classList.add("active");
      interestedBtn.textContent = "Interested ✓";
    });

    tpl.querySelector(".share-btn").addEventListener("click", async () => {
      if (!CURRENT_USER_ID) return alert("RSVP first, then you can generate a share link.");
      const invite = await Api.createInvite(CURRENT_USER_ID, ev._id);
      if (invite.shareUrl) {
        navigator.clipboard?.writeText(invite.shareUrl);
        alert(`Share link copied:\n${invite.shareUrl}`);
      } else {
        alert(invite.error || "Could not create a share link.");
      }
    });

    return tpl;
  }

  return { renderList, buildCard };
})();

// Tab switching
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");

      if (btn.dataset.tab === "dashboard") loadDashboard();
    });
  });
}

async function loadDashboard() {
  const container = document.getElementById("dashboardList");
  if (!CURRENT_USER_ID) {
    container.innerHTML = `<p style="color:var(--muted)">Demo mode: set localStorage.vibe_user_id to see RSVPs.</p>`;
    return;
  }
  const rsvps = await Api.getDashboard(CURRENT_USER_ID);
  EventCards.renderList(container, rsvps.map((r) => r.event));
}

function initCalendarControls() {
  document.getElementById("prevMonth").addEventListener("click", () => CalendarView.shiftMonth(-1));
  document.getElementById("nextMonth").addEventListener("click", () => CalendarView.shiftMonth(1));
  document.getElementById("citySearchBtn").addEventListener("click", async () => {
    const city = document.getElementById("citySearch").value.trim();
    if (!city) return;
    const events = await Api.searchEvents(city);
    EventCards.renderList(document.getElementById("dayEvents"), events);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initCalendarControls();
  CalendarView.load();
  ChatView.init();
});

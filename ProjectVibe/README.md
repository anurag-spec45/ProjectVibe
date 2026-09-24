# Vibe Events — Event Finding & Tracking Platform

Built for the Quantiphi "Vibe Coding" assessment brief: a platform for finding
and tracking events, with an intelligent chat interface and real-time
capabilities.

## Architecture

```
vibe-coding-app/
├── backend/                 Node.js + Express + MongoDB (Mongoose) + Socket.io
│   ├── server.js            App entry point, wires REST + websocket
│   ├── config/db.js         Mongo connection
│   ├── models/               User, Event, Rsvp, Invite (Mongoose schemas)
│   ├── routes/               events, rsvp, invite, chat REST endpoints
│   ├── services/ticketmaster.js  Ticketmaster Discovery API client
│   └── sockets/chatSocket.js     Real-time chat intent parser
└── frontend/                 Static HTML/CSS/JS client (no build step)
    ├── index.html
    ├── css/style.css
    └── js/  api.js, calendar.js, chat.js, app.js
```

## Feature mapping to the brief

- **Event Calendar** — `frontend/js/calendar.js` renders a month grid;
  `GET /api/events/calendar?month=YYYY-MM` groups cached events by day.
- **Event Cards** — `EventCards.buildCard()` in `app.js` shows title, venue,
  date/time, and an "Interested" button per the spec.
- **RSVP Dashboard** — `GET /api/rsvp/dashboard/:userId` + the "My RSVPs" tab.
- **Event Feed (Ticketmaster)** — `services/ticketmaster.js` fetches and
  normalizes events; `GET /api/events/search` upserts them into MongoDB so
  every event gets a stable local `_id` to hang RSVPs/invites off of.
- **Persistence (MongoDB)** — `models/User.js`, `Event.js`, `Rsvp.js`,
  `Invite.js`. `User.reminderSettings` covers event-reminder preferences.
- **The Vibe Check (Friend Invite)** — `models/Invite.js` +
  `routes/invite.js`:
  - `POST /api/invite` generates a share link once the user has RSVP'd.
  - `GET /api/invite/:code` is the link a friend clicks; it de-duplicates
    clicks per visitor, updates `clickedBy`, and redirects into the app.
  - Socket.io broadcasts `invite:clicked` so the "Friends Attending" count
    on the event card updates live, without a page refresh.
- **Intelligent chat + real-time** — `sockets/chatSocket.js` parses intents
  ("find events in `<city>`", "I'm interested in `<event>`") and replies over
  a Socket.io connection (`chat:message` → `chat:reply`), with a REST
  fallback (`POST /api/chat`) if sockets aren't available. The parser is
  isolated in `handleChatMessage()` so it can be swapped for a call to an
  LLM API later without touching the transport layer.

## Setup

### Backend
```bash
cd backend
cp .env.example .env      # fill in MONGO_URI and TICKETMASTER_API_KEY
npm install
npm run dev                # nodemon, or `npm start`
```

### Frontend
The frontend is plain HTML/CSS/JS with no build step — open
`frontend/index.html` directly, or serve it:
```bash
cd frontend
npx serve .                # or any static file server
```
Set `CLIENT_ORIGIN` in the backend `.env` to match wherever you serve it
from (CORS + the invite redirect both use it).

### Demo user
There's no auth flow in this MVP. To exercise RSVP/invite flows in the
browser console:
```js
localStorage.setItem("vibe_user_id", "<a real Mongo User _id>");
```
(Create one via `mongosh` or a quick POST to seed a `User` document.)

## Design notes for the viva

- **Why cache Ticketmaster events in Mongo instead of hitting the API on
  every request?** RSVPs and invites need a stable local id to reference;
  Ticketmaster ids are stable too, so `ticketmasterId` is unique-indexed and
  used as the upsert key — repeated searches don't create duplicates.
- **Why Socket.io for chat *and* invite clicks?** Both are "push" updates
  (a friend clicking a link should update *your* screen without a refresh),
  which is the same real-time requirement the brief calls out for the chat
  interface — one `io` instance serves both.
- **Click de-duplication** on invites uses `req.ip` (or a client-supplied
  `uid`) so refreshing the same link doesn't inflate "Friends Attending."
  A production version would tie this to authenticated user ids.

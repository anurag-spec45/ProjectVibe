require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const eventsRouter = require("./routes/events");
const rsvpRouter = require("./routes/rsvp");
const inviteRouter = require("./routes/invite");
const chatRouter = require("./routes/chat");
const { registerChatSocket } = require("./sockets/chatSocket");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || "*" },
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

// Make io available to route handlers (req.io.emit(...)) so REST actions
// like RSVPs and invite clicks can also push real-time updates.
app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "vibe-events-backend" }));

app.use("/api/events", eventsRouter);
app.use("/api/rsvp", rsvpRouter);
app.use("/api/invite", inviteRouter);
app.use("/api/chat", chatRouter);

registerChatSocket(io);

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
});

// Real-time chat panel, backed by Socket.io with a REST fallback.
const ChatView = (() => {
  let socket = null;

  function init() {
    const wsUrl = window.location.hostname === "localhost" ? "http://localhost:5000" : window.location.origin;
    try {
      socket = io(wsUrl);
      socket.on("chat:reply", (reply) => renderReply(reply));
    } catch (e) {
      console.warn("Socket.io unavailable, falling back to REST chat", e);
    }

    document.getElementById("chatForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("chatInput");
      const message = input.value.trim();
      if (!message) return;

      appendBubble(message, "user");
      input.value = "";

      if (socket && socket.connected) {
        socket.emit("chat:message", { message, userId: CURRENT_USER_ID });
      } else {
        const reply = await Api.chatFallback(message, CURRENT_USER_ID);
        renderReply(reply);
      }
    });
  }

  function appendBubble(text, who) {
    const win = document.getElementById("chatWindow");
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${who}`;
    bubble.textContent = text;
    win.appendChild(bubble);
    win.scrollTop = win.scrollHeight;
  }

  function renderReply(reply) {
    appendBubble(reply.text, "bot");
    if (reply.type === "event-list" && reply.events?.length) {
      const win = document.getElementById("chatWindow");
      const wrap = document.createElement("div");
      wrap.className = "event-card-list";
      EventCards.renderList(wrap, reply.events);
      win.appendChild(wrap);
      win.scrollTop = win.scrollHeight;
    }
  }

  return { init };
})();

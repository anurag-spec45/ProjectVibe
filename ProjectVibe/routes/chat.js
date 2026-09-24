const { OpenAI } = require('openai');
const axios = require('axios');
const RSVP = require('../models/RSVP');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Available tools for the LLM agent
const tools = [
  {
    type: "function",
    function: {
      name: "search_events",
      description: "Search for real-time events using city or category keywords",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name, e.g. New York, Los Angeles" },
          keyword: { type: "string", description: "Genre, artist, or event type" }
        },
        required: ["city"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_rsvp",
      description: "RSVP user to an event and generate a share link",
      parameters: {
        type: "object",
        properties: {
          eventId: { type: "string" },
          eventTitle: { type: "string" },
          eventDate: { type: "string" },
          venue: { type: "string" }
        },
        required: ["eventId", "eventTitle", "eventDate", "venue"]
      }
    }
  }
];

async function handleChatStream(ws, rawMessage, wss) {
  try {
    const { prompt, userId } = JSON.parse(rawMessage);

    const messages = [
      { role: "system", content: "You are VibeBot, an intelligent event-finding assistant. You can search live events and automatically execute RSVPs." },
      { role: "user", content: prompt }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      tools: tools,
      tool_choice: "auto"
    });

    const responseMessage = response.choices[0].message;

    // Handle tool execution
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        if (fnName === "search_events") {
          const events = await fetchTicketmasterEvents(args.city, args.keyword);
          ws.send(JSON.stringify({ type: "EVENT_RESULTS", data: events }));
          ws.send(JSON.stringify({ type: "CHAT_TEXT", text: `I found ${events.length} events in${args.city}. Check the event cards above!` }));
        } 
        
        else if (fnName === "create_rsvp") {
          const inviteCode = `vibe-${Math.random().toString(36).substring(2, 7)}`;
          const rsvp = await RSVP.create({
            userId: userId || "650000000000000000000001",
            eventId: args.eventId,
            eventTitle: args.eventTitle,
            eventDate: args.eventDate,
            venue: args.venue,
            inviteCode: inviteCode
          });

          // Broadcast RSVP update over WebSocket
          wss.clients.forEach(client => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({ type: "RSVP_UPDATED", data: rsvp }));
            }
          });

          ws.send(JSON.stringify({ 
            type: "CHAT_TEXT", 
            text: `Awesome! You are officially RSVP'd to **${args.eventTitle}**. Here is your Vibe Check invite link: \`http://localhost:5000/api/share/${inviteCode}\`` 
          }));
        }
      }
    } else {
      ws.send(JSON.stringify({ type: "CHAT_TEXT", text: responseMessage.content }));
    }
  } catch (error) {
    ws.send(JSON.stringify({ type: "ERROR", text: "Error processing chat query." }));
  }
}

async function fetchTicketmasterEvents(city, keyword = '') {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await axios.get(`https://app.ticketmaster.com/discovery/v2/events.json?city=${city}&keyword=${keyword}&apikey=${apiKey}`); //
    const raw = res.data._embedded?.events || [];
    return raw.map(e => ({
      id: e.id,
      title: e.name,
      venue: e._embedded?.venues?.[0]?.name || 'TBA',
      date: e.dates?.start?.localDate,
      time: e.dates?.start?.localTime || '19:00',
      category: e.classifications?.[0]?.segment?.name || 'General'
    }));
  } catch (e) {
    return [];
  }
}

module.exports = { handleChatStream };
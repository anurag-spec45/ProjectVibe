const axios = require("axios");

const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

/**
 * Thin wrapper around the Ticketmaster Discovery API.
 * Normalizes the (fairly deep) Ticketmaster response into the flat
 * shape our Event model expects.
 */
async function fetchEvents({ city, keyword, startDateTime, endDateTime, size = 20 } = {}) {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error("TICKETMASTER_API_KEY is not set in the environment");
  }

  const params = {
    apikey: apiKey,
    size,
    sort: "date,asc",
  };
  if (city) params.city = city;
  if (keyword) params.keyword = keyword;
  if (startDateTime) params.startDateTime = startDateTime;
  if (endDateTime) params.endDateTime = endDateTime;

  const { data } = await axios.get(BASE_URL, { params });
  const events = data?._embedded?.events || [];

  return events.map(normalizeEvent);
}

function normalizeEvent(raw) {
  const venue = raw?._embedded?.venues?.[0];
  const dateObj = raw?.dates?.start?.dateTime || raw?.dates?.start?.localDate;
  const priceRange = raw?.priceRanges?.[0]
    ? `${raw.priceRanges[0].min} - ${raw.priceRanges[0].max} ${raw.priceRanges[0].currency}`
    : "";

  return {
    ticketmasterId: raw.id,
    title: raw.name,
    venue: venue?.name || "TBA",
    city: venue?.city?.name || "",
    date: dateObj ? new Date(dateObj) : null,
    time: raw?.dates?.start?.localTime || "",
    imageUrl: raw?.images?.[0]?.url || "",
    url: raw?.url || "",
    classification: raw?.classifications?.[0]?.segment?.name || "",
    priceRange,
    raw,
  };
}

module.exports = { fetchEvents, normalizeEvent };

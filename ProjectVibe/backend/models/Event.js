const mongoose = require("mongoose");

// Locally cached copy of a Ticketmaster event so we can attach
// app-specific data (RSVPs, friend counts) to a stable _id.
const eventSchema = new mongoose.Schema(
  {
    ticketmasterId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    venue: { type: String, default: "TBA" },
    city: { type: String, default: "" },
    date: { type: Date, required: true, index: true },
    time: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    url: { type: String, default: "" },
    classification: { type: String, default: "" },
    priceRange: { type: String, default: "" },
    raw: { type: Object }, // original Ticketmaster payload, kept for detail views
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);

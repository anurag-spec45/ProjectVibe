const mongoose = require("mongoose");

const rsvpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    status: { type: String, enum: ["interested", "going", "cancelled"], default: "interested" },
    reminderSet: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A user can only have one RSVP record per event.
rsvpSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("Rsvp", rsvpSchema);

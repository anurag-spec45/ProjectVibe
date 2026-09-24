const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clicks: { type: Number, default: 0 },
    // de-duplicated list of users/fingerprints who actually clicked,
    // so "Friends Attending" reflects unique friends, not raw clicks.
    clickedBy: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);

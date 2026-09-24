const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    city: { type: String, default: "" },
    reminderSettings: {
      enabled: { type: Boolean, default: true },
      hoursBefore: { type: Number, default: 24 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

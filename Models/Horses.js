const mongoose = require('mongoose');

const horsesSchema = new mongoose.Schema(
  {
    horseNumber: {
      type: Number,
      required: true,
      unique: true, // Prevent duplicate horse numbers
    },
    horseName: {
      type: String,
      required: true,
      unique: true, // Prevent duplicate horse names
    },
    isActive: {
      type: Boolean,
      default: true, // ✅ Default: horse is active when created
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Horses", horsesSchema);

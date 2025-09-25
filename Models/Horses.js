const mongoose = require('mongoose');

const horsesSchema = new mongoose.Schema(
  {
    horseNumber: {
      type: String,
      required: true,
      unique: true, // ✅ prevent duplicates at DB level too
    },
    horseName: {
      type: String,
      required: true,
       unique: true, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Horses", horsesSchema);

const mongoose = require('mongoose');

const horseWinSchema = new mongoose.Schema({
  horseNumberToWin: {   // single field for winning amount
    type: Number,
    default: 0
  },
  setBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // admin who set winner
  }
}, { timestamps: true });

module.exports = mongoose.model("HorseWin", horseWinSchema);

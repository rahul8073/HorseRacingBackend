const mongoose = require('mongoose');

const betHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    horseId: { type: String, required: true },
    horseNumber: { type: String, required: true },
    horseName: { type: String, required: true },
    betAmount: { type: Number, required: true },
    winningAmount: { type: Number, required: true },
    status: { type: String, enum: ['won', 'lost'], required: true },
    mode: { type: String, enum: ['High', 'Low'], required: true },
    raceDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("BetHistory", betHistorySchema);

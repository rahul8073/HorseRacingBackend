const mongoose = require('mongoose');

const betHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    horseId: { type: String, required: true },
    horseName: { type: String, required: true },
    Amount: { type: Number, required: true },
    status: { type: String, enum: ['won', 'lost'], required: true },
    raceDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("BetHistory", betHistorySchema);

const mongoose = require('mongoose');

const horseBetSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true  
    },

    horseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Horses',
        required: true  
    },  
    Amount: {
        type: Number,
        required: true,
        min: 0
    },
    // betType: {
    //     type: String,
    //     enum: ['win', 'place', 'show'],
    //     required: true
    // },
    betTime: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'won', 'lost'],
        default: 'pending'
    }
},{timestamps: true});
module.exports = mongoose.model("horseBet", horseBetSchema);
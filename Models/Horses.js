const mongoose = require('mongoose');

const horsesSchema = new mongoose.Schema({

    ID: {
        type: String,
        required: true  
    }, 
    horseName: {
        type:String,
        required: true  
    },  
    
},{timestamps: true});
module.exports = mongoose.model("Horses", horsesSchema);
const mongoose = require("mongoose");
const user = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
  },

  password: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("User", user);

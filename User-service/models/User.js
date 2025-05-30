const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

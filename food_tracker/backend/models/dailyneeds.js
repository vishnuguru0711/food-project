const mongoose = require('mongoose');

const dailyNeedSchema = new mongoose.Schema({
  foodItem: { type: String, required: true },
  quantity: { type: Number, required: true },
  orphanage: { type: String, required: true },
  email: { type: String, required: true },  // Added email field
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyNeed', dailyNeedSchema);
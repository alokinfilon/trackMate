const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true }
});

const travelPreferenceSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  options: [optionSchema]
}, { timestamps: true });

module.exports = mongoose.model('TravelPreference', travelPreferenceSchema);
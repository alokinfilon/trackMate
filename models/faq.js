const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String },
  slug: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('FAQ', faqSchema);
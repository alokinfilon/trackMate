const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user_name: { type: String, required: true },
  posted_date: { type: Date, required: true },
  review: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  likes: { type: Number, default: 0 },
  user_image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
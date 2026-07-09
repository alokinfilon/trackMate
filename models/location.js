const mongoose = require('mongoose');

const subLocationSchema = new mongoose.Schema({
  sub_loc_id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  price: {
    amount: { type: Number, required: true, default: 0.0 },
    currency: { type: String, required: true, default: 'USD' },
    basis: { type: String, required: true }
  }
});

const reviewSchema = new mongoose.Schema({
  review_id: { type: String, required: true },
  username: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  date: { type: Date, required: true }, 
  comment: { type: String, required: true }
});

const historicalSiteSchema = new mongoose.Schema({
  location_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true, default: 'historical_site' },
  description: { type: String, required: true },
  overall_rating: { type: Number, required: true, min: 0, max: 5 },
  
  geography: {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true }
  },
  
  logistics: {
    entry_fee: {
      amount: { type: Number, required: true, default: 0.0 },
      currency: { type: String, required: true, default: 'USD' },
      basis: { type: String, required: true }
    },
    opening_hours: {
      weekdays: { type: String, required: true },
      weekends: { type: String, required: true }
    },
    best_time_to_visit: { type: String },
    crowd_level_indicator: { type: String }
  },

  sub_locations: [subLocationSchema],

  historical_context: {
    historical_era: { type: String },
    year_established: { type: Number },
    architectural_style: { type: String },
    guided_tours_available: { type: Boolean, default: false },
    tour_cost: { type: String }
  },

  trivia_and_culture: {
    quick_facts: [{ type: String }],
    famous_visitors: [{ type: String }],
    hidden_gem: { type: String }
  },

  reviews: [reviewSchema],

  amenities: {
    has_restrooms: { type: Boolean, default: false },
    has_drinking_water: { type: Boolean, default: false },
    has_parking: { type: Boolean, default: false },
    parking_capacity: { type: String },
    has_visitor_center: { type: Boolean, default: false },
    has_gift_shop: { type: Boolean, default: false },
    is_wheelchair_accessible: { type: Boolean, default: false },
    is_pet_friendly: { type: Boolean, default: false }
  },

  media: {
    hero_image_url: { type: String },
    gallery: [{ type: String }]
  }
}, { timestamps: true });

// Ensures rapid geospatial query support
historicalSiteSchema.index({ 'geography.coordinates': '2dsphere' });

const HistoricalSite = mongoose.model('HistoricalSite', historicalSiteSchema);
module.exports = HistoricalSite;

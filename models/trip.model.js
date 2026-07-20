const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // References your existing User model
      required: [true, 'Trip must belong to a specific user (userId is required)']
    },
    location_id: {
      type: String, // Change to Number if your JSON file uses numeric IDs
      required: [true, 'Main location_id is required']
    },
    sublocation: {
      type: [String], // Array of strings. Change to [Number] if sublocation IDs are numeric
      default: []
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'partially completed', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid trip status. Must be lowercase: upcoming, partially completed, completed, or cancelled.'
      },
      default: 'upcoming',
      required: true
    },
    price: {
      type: Number,
      required: [true, 'Base price from frontend is required'],
      min: [0, 'Price cannot be negative']
    },
    number_of_people: {
      type: Number,
      required: [true, 'Number of people is required'],
      min: [1, 'Number of people must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Number of people must be a whole integer value'
      }
    },
    total_price: {
      type: Number,
      required: [true, 'Calculated total_price is required'],
      min: [0, 'Total price cannot be negative']
    },
    start_date: {
      type: Date,
      required: [true, 'Trip start_date is required']
    },
    end_date: {
      type: Date,
      required: [true, 'Trip end_date is required']
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt ISO-8601 dates
  }
);

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;

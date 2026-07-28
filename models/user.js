const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false, 
      unique: true,
      sparse: true,   
      trim: true,
      lowercase: true, 
    },
    mobile: {
      type: String,
      required: false, 
      unique: true,
      sparse: true,    
      trim: true,
    },
    password: {
      type: String,
      required: false, 
      trim: true,
    },
    auth0Id: {
      type: String,
      unique: true,
      sparse: true,
    },
    // --- Profile Fields ---
    full_name: {
      type: String,
      default: "",
      trim: true,
    },
    country: {
      type: String,
      default: "",
      trim: true,
    },
    user_image: {
      type: String,
      default: "",
    },
    // --- Travel Preferences Fields (Multi-select arrays) ---
    preferences: {
      fav_country: [{ type: String, trim: true }],
      dream_destination: [{ type: String, trim: true }],
      travel_budget: [{ type: String, trim: true }],
      trip_type_preference: [{ type: String, trim: true }],
      travel_history: [{ type: String, trim: true }],
      language_spoken: [{ type: String, trim: true }],
      interest_hobbies: [{ type: String, trim: true }],
      seasonal_preference: [{ type: String, trim: true }],
      travel_frequency: [{ type: String, trim: true }],
      travel_preference: [{ type: String, trim: true }],
    },
  },
  { timestamps: true }
);

userSchema.pre("validate", function () {
  if (!this.email && !this.mobile) {
    this.invalidate("email", "Either email or mobile number must be provided.");
    this.invalidate("mobile", "Either email or mobile number must be provided.");
  }

  if (!this.auth0Id && !this.password) {
    this.invalidate("password", "Password is required for traditional registration.");
  }
});

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.password;
    delete returnedObject.confirmPassword;
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;  
  }
});

module.exports = mongoose.model('User', userSchema);
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

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
      // 1. Password is no longer globally required
      required: false, 
      trim: true,
    },
    // 2. Add an optional field to identify external Auth0 profiles explicitly
    auth0Id: {
      type: String,
      unique: true,
      sparse: true,
    }
  },
  { timestamps: true }
);

// 3. Update the conditional validation step
userSchema.pre("validate", function (next) {
  // Enforce that at least email or mobile is present
  if (!this.email && !this.mobile) {
    this.invalidate("email", "Either email or mobile number must be provided.");
    this.invalidate("mobile", "Either email or mobile number must be provided.");
  }

  // CRITICAL FIX: Require password ONLY if it's a traditional native registration
  if (!this.auth0Id && !this.password) {
    this.invalidate("password", "Password is required for traditional registration.");
  }

  next();
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

userSchema.plugin(uniqueValidator.default || uniqueValidator);

module.exports = mongoose.model('User', userSchema);

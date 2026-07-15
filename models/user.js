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
    }
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
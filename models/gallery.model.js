const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Links directly to your existing User collection
      required: [true, "An image upload must belong to a verified user."]
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip", // Links to your Trip collection from the 1st API
      required: [true, "An image upload must be linked to a specific trip context."]
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null
    },
    imageUrl: {
      type: String,
      required: [true, "The physical image storage URL path string is required."]
    },
    caption: {
      type: String,
      trim: true,
      default: "" // Optional description fallback if left empty by the traveler
    },
    accessibility: {
      type: String,
      enum: {
        values: ["public", "shared", "private"],
        message: "{VALUE} is an invalid accessibility state. Must be public, shared, or private."
      },
      default: "shared", // Shared among trip members by default
      required: true
    }
  },
  { 
    timestamps: true // Automatically tracks exactly when photos were uploaded
  }
);

module.exports = mongoose.model("Gallery", gallerySchema);

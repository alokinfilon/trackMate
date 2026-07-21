const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A collection must belong to a user."],
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "A collection must be linked to a trip."],
    },
    name: {
      type: String,
      required: [true, "Collection name is required."],
      trim: true,
      maxlength: [100, "Collection name cannot exceed 100 characters."],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters."],
    },
    accessibility: {
      type: String,
      enum: {
        values: ["public", "shared", "private"],
        message: "{VALUE} is invalid. Must be public, shared, or private.",
      },
      default: "shared",
      required: true,
    },
  },
  { timestamps: true }
);

collectionSchema.index({ userId: 1, tripId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Collection", collectionSchema);

const mongoose = require("mongoose");

const collectionShareSchema = new mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: [true, "Collection is required."],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Shared user is required."],
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Share owner is required."],
    },
    role: {
      type: String,
      enum: {
        values: ["viewer", "editor"],
        message: "{VALUE} is invalid. Must be viewer or editor.",
      },
      default: "viewer",
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "accepted", "declined", "revoked", "expired"],
        message: "{VALUE} is invalid. Must be pending, accepted, declined, revoked, or expired.",
      },
      default: "accepted",
      required: true,
    },
  },
  { timestamps: true }
);

collectionShareSchema.index({ collectionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("CollectionShare", collectionShareSchema);

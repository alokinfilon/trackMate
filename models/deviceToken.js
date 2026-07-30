const mongoose = require("mongoose");

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required."],
      index: true,
    },
    token: {
      type: String,
      required: [true, "Device token is required."],
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: {
        values: ["android", "ios", "web", "unknown"],
        message: "{VALUE} is invalid.",
      },
      default: "unknown",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

deviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

module.exports = mongoose.model("DeviceToken", deviceTokenSchema);

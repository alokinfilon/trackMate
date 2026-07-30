const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification recipient is required."],
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: {
        values: [
          "collection_invite",
          "collection_invite_accepted",
          "collection_invite_declined",
          "collection_access_revoked",
          "collection_updated",
          "collection_deleted",
          "photo_uploaded",
          "photo_updated",
          "photo_deleted",
        ],
        message: "{VALUE} is invalid.",
      },
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      default: "collection",
      trim: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
      index: true,
    },
    shareId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollectionShare",
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    state: {
      type: String,
      enum: {
        values: ["unread", "read", "actioned"],
        message: "{VALUE} is invalid.",
      },
      default: "unread",
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

const mongoose = require("mongoose");
const Trip = require("../models/trip.model");
const Collection = require("../models/collection.model");
const CollectionShare = require("../models/collectionShare");

const ACCESSIBILITY_VALUES = ["public", "shared", "private"];
const COLLECTION_ROLE_VALUES = ["viewer", "editor"];

function parseObjectId(value, label = "ID") {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return { error: `Invalid ${label}.` };
  }
  return { id: new mongoose.Types.ObjectId(value) };
}

function normalizeAccessibility(value, fallback = "shared") {
  if (!value) {
    return fallback;
  }
  const normalized = String(value).toLowerCase().trim();
  if (!ACCESSIBILITY_VALUES.includes(normalized)) {
    return null;
  }
  return normalized;
}

function normalizeCollectionRole(value, fallback = "viewer") {
  if (!value) {
    return fallback;
  }

  const normalized = String(value).toLowerCase().trim();
  if (!COLLECTION_ROLE_VALUES.includes(normalized)) {
    return null;
  }

  return normalized;
}

async function assertTripOwnership(tripId, userId) {
  const parsed = parseObjectId(tripId, "trip ID");
  if (parsed.error) {
    return { status: 400, error: parsed.error };
  }

  const trip = await Trip.findOne({ _id: parsed.id, userId });
  if (!trip) {
    return { status: 404, error: "Trip not found or access denied." };
  }

  return { trip, tripObjectId: parsed.id };
}

async function assertCollectionOwnership(collectionId, userId) {
  const parsed = parseObjectId(collectionId, "collection ID");
  if (parsed.error) {
    return { status: 400, error: parsed.error };
  }

  const collection = await Collection.findOne({ _id: parsed.id, userId });
  if (!collection) {
    return { status: 404, error: "Collection not found or access denied." };
  }

  return { collection, collectionObjectId: parsed.id };
}

async function resolveCollectionAccess(collectionId, userId) {
  const parsed = parseObjectId(collectionId, "collection ID");
  if (parsed.error) {
    return { status: 400, error: parsed.error };
  }

  const collection = await Collection.findById(parsed.id);
  if (!collection) {
    return { status: 404, error: "Collection not found or access denied." };
  }

  const isOwner = String(collection.userId) === String(userId);
  const share = isOwner
    ? null
    : await CollectionShare.findOne({
        collectionId: parsed.id,
        userId,
        $or: [
          { status: "accepted" },
          { status: { $exists: false } },
        ],
      });

  return {
    collection,
    collectionObjectId: parsed.id,
    isOwner,
    share,
  };
}

function canAccessCollection(context, action) {
  if (!context || !context.collection) {
    return false;
  }

  if (context.isOwner) {
    return true;
  }

  if (!context.share || (context.share.status && context.share.status !== "accepted")) {
    return false;
  }

  if (action === "view") {
    return true;
  }

  if (context.collection.accessibility === "private") {
    return false;
  }

  if (action === "add" || action === "edit") {
    return context.collection.accessibility === "shared" && context.share.role === "editor";
  }

  return false;
}

async function getAccessibleCollectionIds(userId, filters = {}) {
  const ownedCollections = await Collection.find({ ...filters, userId })
    .select("_id")
    .lean();

  const sharedCollections = await CollectionShare.find({
    userId,
    $or: [
      { status: "accepted" },
      { status: { $exists: false } },
    ],
  }).populate({
    path: "collectionId",
    select: "_id",
  });

  const ownedIds = ownedCollections.map((collection) => String(collection._id));
  const sharedIds = sharedCollections
    .map((share) => share.collectionId && String(share.collectionId._id))
    .filter(Boolean);

  return [...new Set([...ownedIds, ...sharedIds])];
}

function handleGalleryError(res, error, fallbackMessage) {
  if (error.name === "ValidationError") {
    const errors = {};
    Object.keys(error.errors).forEach((key) => {
      errors[key] = error.errors[key].message;
    });
    return res.status(400).json({ success: false, errors });
  }

  if (error.code === 11000) {
    const duplicateKey = error.keyPattern || {};
    if (duplicateKey.collectionId && duplicateKey.userId) {
      return res.status(409).json({
        success: false,
        error: "This user already has access to the collection.",
      });
    }

    return res.status(409).json({
      success: false,
      error: "A collection with this name already exists for this trip.",
    });
  }

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
    error: error.message,
  });
}

module.exports = {
  ACCESSIBILITY_VALUES,
  COLLECTION_ROLE_VALUES,
  parseObjectId,
  normalizeAccessibility,
  normalizeCollectionRole,
  assertTripOwnership,
  assertCollectionOwnership,
  resolveCollectionAccess,
  canAccessCollection,
  getAccessibleCollectionIds,
  handleGalleryError,
};

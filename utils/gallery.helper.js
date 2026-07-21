const mongoose = require("mongoose");
const Trip = require("../models/trip.model");
const Collection = require("../models/collection.model");

const ACCESSIBILITY_VALUES = ["public", "shared", "private"];

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

function buildImageVisibilityFilter(userId, extraFilters = {}) {
  return {
    ...extraFilters,
    $or: [
      { accessibility: "public" },
      { accessibility: "shared" },
      { accessibility: "private", userId },
    ],
  };
}

function buildCollectionVisibilityFilter(userId, extraFilters = {}) {
  return buildImageVisibilityFilter(userId, extraFilters);
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
  parseObjectId,
  normalizeAccessibility,
  assertTripOwnership,
  assertCollectionOwnership,
  buildImageVisibilityFilter,
  buildCollectionVisibilityFilter,
  handleGalleryError,
};

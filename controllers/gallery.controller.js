const mongoose = require("mongoose");
const Gallery = require("../models/gallery.model");
const Collection = require("../models/collection.model");
const Trip = require("../models/trip.model");
const {
  normalizeAccessibility,
  assertTripOwnership,
  assertCollectionOwnership,
  buildImageVisibilityFilter,
  buildCollectionVisibilityFilter,
  handleGalleryError,
  parseObjectId,
} = require("../utils/gallery.helper");

exports.createCollection = async (req, res) => {
  try {
    const { tripId, name, description, accessibility } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (!tripId || !name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: "tripId and name are required.",
      });
    }

    const tripCheck = await assertTripOwnership(tripId, userId);
    if (tripCheck.error) {
      return res.status(tripCheck.status).json({ success: false, error: tripCheck.error });
    }

    const normalizedAccessibility = normalizeAccessibility(accessibility);
    if (!normalizedAccessibility) {
      return res.status(400).json({
        success: false,
        error: "accessibility must be public, shared, or private.",
      });
    }

    const collection = await Collection.create({
      userId,
      tripId: tripCheck.tripObjectId,
      name: String(name).trim(),
      description: description || "",
      accessibility: normalizedAccessibility,
    });

    return res.status(201).json({
      success: true,
      message: "Photo collection created successfully.",
      data: collection,
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to create collection.");
  }
};

exports.listCollections = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { tripId } = req.query;
    const filters = buildCollectionVisibilityFilter(userId);

    if (tripId) {
      const parsed = parseObjectId(tripId, "trip ID");
      if (parsed.error) {
        return res.status(400).json({ success: false, error: parsed.error });
      }

      const trip = await Trip.findById(parsed.id);
      if (!trip) {
        return res.status(404).json({ success: false, error: "Trip not found." });
      }

      filters.tripId = parsed.id;
    }

    const collections = await Collection.find(filters).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: collections.length,
      data: collections,
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to fetch collections.");
  }
};

exports.getCollection = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { collectionId } = req.params;

    const parsed = parseObjectId(collectionId, "collection ID");
    if (parsed.error) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const collection = await Collection.findOne(
      buildCollectionVisibilityFilter(userId, { _id: parsed.id })
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        error: "Collection not found or access denied.",
      });
    }

    const photos = await Gallery.find(
      buildImageVisibilityFilter(userId, { collectionId: collection._id })
    )
      .sort({ createdAt: -1 })
      .populate("userId", "email mobile");

    return res.status(200).json({
      success: true,
      data: {
        collection,
        photos,
        photoCount: photos.length,
      },
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to fetch collection.");
  }
};

exports.updateCollection = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { collectionId } = req.params;
    const { name, description, accessibility } = req.body;

    const collectionCheck = await assertCollectionOwnership(collectionId, userId);
    if (collectionCheck.error) {
      return res.status(collectionCheck.status).json({ success: false, error: collectionCheck.error });
    }

    const collection = collectionCheck.collection;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, error: "Collection name cannot be empty." });
      }
      collection.name = String(name).trim();
    }

    if (description !== undefined) {
      collection.description = String(description).trim();
    }

    if (accessibility !== undefined) {
      const normalizedAccessibility = normalizeAccessibility(accessibility, null);
      if (!normalizedAccessibility) {
        return res.status(400).json({
          success: false,
          error: "accessibility must be public, shared, or private.",
        });
      }
      collection.accessibility = normalizedAccessibility;
    }

    const updatedCollection = await collection.save();

    return res.status(200).json({
      success: true,
      message: "Collection updated successfully.",
      data: updatedCollection,
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to update collection.");
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { collectionId } = req.params;

    const collectionCheck = await assertCollectionOwnership(collectionId, userId);
    if (collectionCheck.error) {
      return res.status(collectionCheck.status).json({ success: false, error: collectionCheck.error });
    }

    await Gallery.updateMany(
      { collectionId: collectionCheck.collectionObjectId },
      { $set: { collectionId: null } }
    );

    await Collection.findByIdAndDelete(collectionCheck.collectionObjectId);

    return res.status(200).json({
      success: true,
      message: "Collection deleted. Photos were kept in the trip gallery.",
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to delete collection.");
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { caption, accessibility, collectionId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const tripCheck = await assertTripOwnership(tripId, userId);
    if (tripCheck.error) {
      return res.status(tripCheck.status).json({ success: false, error: tripCheck.error });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        error: "Image upload failed: send the file in multipart field named 'image'.",
      });
    }

    const normalizedAccessibility = normalizeAccessibility(accessibility);
    if (!normalizedAccessibility) {
      return res.status(400).json({
        success: false,
        error: "accessibility must be public, shared, or private.",
      });
    }

    let linkedCollectionId = null;
    if (collectionId) {
      const collectionCheck = await assertCollectionOwnership(collectionId, userId);
      if (collectionCheck.error) {
        return res.status(collectionCheck.status).json({ success: false, error: collectionCheck.error });
      }

      if (String(collectionCheck.collection.tripId) !== String(tripCheck.tripObjectId)) {
        return res.status(400).json({
          success: false,
          error: "Collection does not belong to this trip.",
        });
      }

      linkedCollectionId = collectionCheck.collectionObjectId;
    }

    const savedPhoto = await Gallery.create({
      userId,
      tripId: tripCheck.tripObjectId,
      collectionId: linkedCollectionId,
      imageUrl: req.file.path,
      caption: caption || "",
      accessibility: normalizedAccessibility,
    });

    return res.status(201).json({
      success: true,
      message: "Image uploaded and pinned to your trip gallery successfully!",
      data: savedPhoto,
    });
  } catch (error) {
    return handleGalleryError(res, error, "Image upload failed.");
  }
};

exports.getTripGallery = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const parsed = parseObjectId(tripId, "trip ID");
    if (parsed.error) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const trip = await Trip.findById(parsed.id);
    if (!trip) {
      return res.status(404).json({ success: false, error: "Trip not found." });
    }

    const photos = await Gallery.find(
      buildImageVisibilityFilter(userId, { tripId: parsed.id })
    )
      .sort({ createdAt: -1 })
      .populate("userId", "email mobile")
      .populate("collectionId", "name accessibility");

    return res.status(200).json({
      success: true,
      count: photos.length,
      data: photos,
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to fetch trip gallery.");
  }
};

exports.getImageById = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const parsed = parseObjectId(imageId, "image ID");
    if (parsed.error) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const photo = await Gallery.findOne(
      buildImageVisibilityFilter(userId, { _id: parsed.id })
    )
      .populate("userId", "email mobile")
      .populate("collectionId", "name accessibility")
      .populate("tripId", "location_id status start_date end_date");

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: "Image not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      data: photo,
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to fetch image.");
  }
};

exports.assignImageToCollection = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { collectionId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const photo = await Gallery.findOne({ _id: imageId, userId });
    if (!photo) {
      return res.status(404).json({
        success: false,
        error: "Image not found or you are not the owner.",
      });
    }

    if (collectionId === null || collectionId === "" || collectionId === undefined) {
      photo.collectionId = null;
      await photo.save();
      return res.status(200).json({
        success: true,
        message: "Image removed from collection.",
        data: photo,
      });
    }

    const collectionCheck = await assertCollectionOwnership(collectionId, userId);
    if (collectionCheck.error) {
      return res.status(collectionCheck.status).json({ success: false, error: collectionCheck.error });
    }

    if (String(collectionCheck.collection.tripId) !== String(photo.tripId)) {
      return res.status(400).json({
        success: false,
        error: "Collection and image must belong to the same trip.",
      });
    }

    photo.collectionId = collectionCheck.collectionObjectId;
    await photo.save();

    return res.status(200).json({
      success: true,
      message: "Image added to collection.",
      data: photo,
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to update image collection.");
  }
};

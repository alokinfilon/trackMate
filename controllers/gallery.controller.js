const mongoose = require("mongoose");
const Gallery = require("../models/gallery.model");
const Collection = require("../models/collection.model");
const CollectionShare = require("../models/collectionShare");
const User = require("../models/user");
const Trip = require("../models/trip.model");
const helper = require("../utils/helper");
const { cloudinary } = require("../utils/cloudinary");
const {
  notifyCollectionParticipants,
  notifyCollectionInvite,
  notifyAccessRevoked,
} = require("../utils/notification.service");
const {
  normalizeAccessibility,
  normalizeCollectionRole,
  assertTripOwnership,
  assertCollectionOwnership,
  resolveCollectionAccess,
  canAccessCollection,
  getAccessibleCollectionIds,
  handleGalleryError,
  parseObjectId,
} = require("../utils/gallery.helper");

function extractCloudinaryPublicId(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  const marker = "/upload/";
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const withoutPrefix = imageUrl.slice(markerIndex + marker.length);
  const pathWithoutVersion = withoutPrefix.replace(/^v\d+\//, "");
  const lastDotIndex = pathWithoutVersion.lastIndexOf(".");

  return lastDotIndex === -1
    ? pathWithoutVersion
    : pathWithoutVersion.slice(0, lastDotIndex);
}

function buildPermissions(context) {
  return {
    canView: canAccessCollection(context, "view"),
    canAdd: canAccessCollection(context, "add"),
    canEdit: canAccessCollection(context, "edit"),
    canDelete: Boolean(context && context.isOwner),
  };
}

async function loadShareTarget(identifier) {
  const parsedIdentifier = helper.parseIdentifier(identifier);
  if (parsedIdentifier.error) {
    return { status: 400, error: parsedIdentifier.error };
  }

  const user = await User.findOne({
    [parsedIdentifier.type]: parsedIdentifier.value,
  });

  if (!user) {
    return { status: 404, error: "User not found." };
  }

  return { user };
}

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

    const cleanName = String(name).trim();
    const existingCollection = await Collection.findOne({
      tripId: tripCheck.tripObjectId,
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });

    if (existingCollection) {
      return res.status(400).json({
        success: false,
        error: "A collection with this name already exists for this trip.",
      });
    }

    const collection = await Collection.create({
      userId,
      tripId: tripCheck.tripObjectId,
      name: cleanName,
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
    const filters = {};

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

    const accessibleCollectionIds = await getAccessibleCollectionIds(userId, filters);
    const collections = accessibleCollectionIds.length
      ? await Collection.find({ _id: { $in: accessibleCollectionIds } }).sort({ createdAt: -1 })
      : [];

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

    const access = await resolveCollectionAccess(collectionId, userId);
    if (access.status) {
      return res.status(access.status).json({ success: false, error: access.error });
    }

    if (!canAccessCollection(access, "view")) {
      return res.status(404).json({
        success: false,
        error: "Collection not found or access denied.",
      });
    }

    const photoFilter = {
      collectionId: access.collectionObjectId,
    };

    if (!access.isOwner) {
      photoFilter.accessibility = { $in: ["public", "shared"] };
    }

    const photos = await Gallery.find(photoFilter)
      .sort({ createdAt: -1 })
      .populate("userId", "email mobile")
      .populate("collectionId", "name accessibility");

    return res.status(200).json({
      success: true,
      data: {
        collection: access.collection,
        permissions: buildPermissions(access),
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
    const { name, description, accessibility } = req.body || {};

    const access = await resolveCollectionAccess(collectionId, userId);
    if (access.status) {
      return res.status(access.status).json({ success: false, error: access.error });
    }

    if (!canAccessCollection(access, "edit")) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to edit this collection.",
      });
    }

    const collection = access.collection;

    if (name === undefined && description === undefined && accessibility === undefined) {
      return res.status(400).json({
        success: false,
        error: "Provide at least one field to update.",
      });
    }

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
      if (!access.isOwner) {
        return res.status(403).json({
          success: false,
          error: "Only the owner can change collection accessibility.",
        });
      }

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

    if (accessibility === "private") {
      const revokedShares = await CollectionShare.find({
        collectionId: access.collectionObjectId,
        status: "accepted",
      }).select("userId");

      await CollectionShare.updateMany(
        { collectionId: access.collectionObjectId, status: "accepted" },
        { $set: { status: "revoked" } }
      );

      await Promise.all(
        revokedShares.map((share) =>
          notifyAccessRevoked({
            recipientId: share.userId,
            actorId: userId,
            collectionId: access.collectionObjectId,
            shareId: null,
            collectionName: updatedCollection.name,
          })
        )
      );
    } else {
      await notifyCollectionParticipants({
        collectionId: access.collectionObjectId,
        actorId: userId,
        type: "collection_updated",
        title: "Collection updated",
        message: `${updatedCollection.name} was updated.`,
        metadata: {
          accessibility: updatedCollection.accessibility,
        },
      });
    }

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

    const access = await resolveCollectionAccess(collectionId, userId);
    if (access.status) {
      return res.status(access.status).json({ success: false, error: access.error });
    }

    if (!access.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Only the owner can delete this collection.",
      });
    }

    const activeShares = await CollectionShare.find({
      collectionId: access.collectionObjectId,
      status: "accepted",
    }).select("userId");

    await Promise.all(
      activeShares.map((share) =>
        notifyAccessRevoked({
          recipientId: share.userId,
          actorId: userId,
          collectionId: access.collectionObjectId,
          shareId: null,
          collectionName: access.collection.name,
        })
      )
    );

    await CollectionShare.updateMany(
      { collectionId: access.collectionObjectId },
      { $set: { status: "revoked" } }
    );

    await Gallery.updateMany(
      { collectionId: access.collectionObjectId },
      { $set: { collectionId: null } }
    );

    await Collection.findByIdAndDelete(access.collectionObjectId);

    return res.status(200).json({
      success: true,
      message: "Collection deleted. Photos were kept in the trip gallery.",
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to delete collection.");
  }
};

exports.shareCollection = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { collectionId } = req.params;
    const { identifier, role } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: "identifier is required.",
      });
    }

    const access = await resolveCollectionAccess(collectionId, userId);
    if (access.status) {
      return res.status(access.status).json({ success: false, error: access.error });
    }

    if (!access.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Only the owner can share this collection.",
      });
    }

    if (access.collection.accessibility === "private") {
      return res.status(400).json({
        success: false,
        error: "Private collections cannot be shared.",
      });
    }

    const targetUserResult = await loadShareTarget(identifier);
    if (targetUserResult.status) {
      return res.status(targetUserResult.status).json({ success: false, error: targetUserResult.error });
    }

    if (String(targetUserResult.user._id) === String(userId)) {
      return res.status(400).json({
        success: false,
        error: "You already own this collection.",
      });
    }

    const normalizedRole = normalizeCollectionRole(
      role,
      access.collection.accessibility === "public" ? "viewer" : "editor"
    );

    if (!normalizedRole) {
      return res.status(400).json({
        success: false,
        error: "role must be viewer or editor.",
      });
    }

    const effectiveRole =
      access.collection.accessibility === "public" ? "viewer" : normalizedRole;

    const existingShare = await CollectionShare.findOne({
      collectionId: access.collectionObjectId,
      userId: targetUserResult.user._id,
    });

    if (existingShare && existingShare.status === "accepted") {
      return res.status(409).json({
        success: false,
        error: "This user already has access to the collection.",
      });
    }

    const share = existingShare || new CollectionShare({
      collectionId: access.collectionObjectId,
      userId: targetUserResult.user._id,
    });

    share.sharedBy = userId;
    share.role = effectiveRole;
    share.status = "pending";
    await share.save();

    await notifyCollectionInvite({
      recipientId: targetUserResult.user._id,
      actorId: userId,
      collectionId: access.collectionObjectId,
      shareId: share._id,
      role: effectiveRole,
      collectionName: access.collection.name,
      accessibility: access.collection.accessibility,
    });

    return res.status(200).json({
      success: true,
      message: "Collection invite sent successfully.",
      data: await share.populate("userId", "email mobile"),
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to share collection.");
  }
};

exports.listCollectionMembers = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { collectionId } = req.params;

    const access = await resolveCollectionAccess(collectionId, userId);
    if (access.status) {
      return res.status(access.status).json({ success: false, error: access.error });
    }

    if (!access.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Only the owner can view collection members.",
      });
    }

    const members = await CollectionShare.find({ collectionId: access.collectionObjectId })
      .sort({ createdAt: -1 })
      .populate("userId", "email mobile")
      .populate("sharedBy", "email mobile");

    return res.status(200).json({
      success: true,
      count: members.length + 1,
      data: [
        {
          userId: access.collection.userId,
          role: "owner",
          accessType: "owner",
        },
        ...members.map((member) => ({
          id: member._id,
          userId: member.userId,
          role: member.role,
          status: member.status,
          sharedBy: member.sharedBy,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        })),
      ],
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to list collection members.");
  }
};

exports.revokeCollectionAccess = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { collectionId, memberId } = req.params;

    const access = await resolveCollectionAccess(collectionId, userId);
    if (access.status) {
      return res.status(access.status).json({ success: false, error: access.error });
    }

    if (!access.isOwner) {
      return res.status(403).json({
        success: false,
        error: "Only the owner can revoke access.",
      });
    }

    const deletedShare = await CollectionShare.findOne({
      collectionId: access.collectionObjectId,
      userId: memberId,
    });

    if (!deletedShare) {
      return res.status(404).json({
        success: false,
        error: "Shared member not found.",
      });
    }

    await CollectionShare.updateOne(
      { _id: deletedShare._id },
      { $set: { status: "revoked" } }
    );

    await notifyAccessRevoked({
      recipientId: deletedShare.userId,
      actorId: userId,
      collectionId: access.collectionObjectId,
      shareId: deletedShare._id,
      collectionName: access.collection.name,
    });

    return res.status(200).json({
      success: true,
      message: "Collection access revoked successfully.",
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to revoke collection access.");
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { caption, accessibility, collectionId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

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

    let tripObjectId = null;
    let linkedCollectionId = null;

    if (collectionId) {
      const access = await resolveCollectionAccess(collectionId, userId);
      if (access.status) {
        return res.status(access.status).json({ success: false, error: access.error });
      }

      if (!canAccessCollection(access, "add")) {
        return res.status(403).json({
          success: false,
          error: "You do not have permission to add photos to this collection.",
        });
      }

      tripObjectId = access.collection.tripId;
      linkedCollectionId = access.collectionObjectId;

      const parsedTrip = parseObjectId(tripId, "trip ID");
      if (parsedTrip.error) {
        return res.status(400).json({ success: false, error: parsedTrip.error });
      }

      if (String(parsedTrip.id) !== String(tripObjectId)) {
        return res.status(400).json({
          success: false,
          error: "Collection does not belong to this trip.",
        });
      }
    } else {
      const tripCheck = await assertTripOwnership(tripId, userId);
      if (tripCheck.error) {
        return res.status(tripCheck.status).json({ success: false, error: tripCheck.error });
      }

      tripObjectId = tripCheck.tripObjectId;
    }

    const savedPhoto = await Gallery.create({
      userId,
      tripId: tripObjectId,
      collectionId: linkedCollectionId,
      imageUrl: req.file.path,
      publicId: req.file.filename || req.file.public_id || extractCloudinaryPublicId(req.file.path),
      caption: caption || "",
      accessibility: normalizedAccessibility,
    });

    if (linkedCollectionId) {
      await notifyCollectionParticipants({
        collectionId: linkedCollectionId,
        actorId: userId,
        type: "photo_uploaded",
        title: "Photo added",
        message: "A new photo was added to the collection.",
        entityType: "photo",
        entityId: savedPhoto._id,
        metadata: {
          accessibility: normalizedAccessibility,
        },
      });
    }

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

    const isOwner = String(trip.userId) === String(userId);
    const accessibleCollectionIds = await getAccessibleCollectionIds(userId, { tripId: parsed.id });

    let photoFilter = { tripId: parsed.id };
    if (!isOwner) {
      photoFilter = {
        tripId: parsed.id,
        collectionId: { $in: accessibleCollectionIds },
        accessibility: { $in: ["public", "shared"] },
      };
    }

    const photos = await Gallery.find(photoFilter)
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

    const photo = await Gallery.findById(parsed.id)
      .populate("userId", "email mobile")
      .populate("collectionId", "name accessibility userId tripId")
      .populate("tripId", "location_id status start_date end_date userId");

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: "Image not found or access denied.",
      });
    }

    const isOwner = String(photo.userId._id || photo.userId) === String(userId);
    if (!isOwner) {
      if (!photo.collectionId) {
        return res.status(404).json({
          success: false,
          error: "Image not found or access denied.",
        });
      }

      const access = await resolveCollectionAccess(photo.collectionId._id, userId);
      if (access.status || !canAccessCollection(access, "view") || !["public", "shared"].includes(photo.accessibility)) {
        return res.status(404).json({
          success: false,
          error: "Image not found or access denied.",
        });
      }
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
      const previousCollectionId = photo.collectionId;
      photo.collectionId = null;
      await photo.save();

      if (previousCollectionId) {
        await notifyCollectionParticipants({
          collectionId: previousCollectionId,
          actorId: userId,
          type: "photo_updated",
          title: "Photo removed from collection",
          message: "A photo was removed from the collection.",
          entityType: "photo",
          entityId: photo._id,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Image removed from collection.",
        data: photo,
      });
    }

    const collectionCheck = await resolveCollectionAccess(collectionId, userId);
    if (collectionCheck.status) {
      return res.status(collectionCheck.status).json({ success: false, error: collectionCheck.error });
    }

    if (!canAccessCollection(collectionCheck, "add")) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to modify this collection.",
      });
    }

    if (String(collectionCheck.collection.tripId) !== String(photo.tripId)) {
      return res.status(400).json({
        success: false,
        error: "Collection and image must belong to the same trip.",
      });
    }

    photo.collectionId = collectionCheck.collectionObjectId;
    await photo.save();

    await notifyCollectionParticipants({
      collectionId: collectionCheck.collectionObjectId,
      actorId: userId,
      type: "photo_updated",
      title: "Photo updated",
      message: "A photo was assigned to a collection.",
      entityType: "photo",
      entityId: photo._id,
    });

    return res.status(200).json({
      success: true,
      message: "Image added to collection.",
      data: photo,
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to update image collection.");
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const parsed = parseObjectId(imageId, "image ID");
    if (parsed.error) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const photo = await Gallery.findOne({ _id: parsed.id, userId });
    if (!photo) {
      return res.status(404).json({
        success: false,
        error: "Image not found or you are not the owner.",
      });
    }

    if (photo.publicId) {
      try {
        await cloudinary.uploader.destroy(photo.publicId, {
          invalidate: true,
        });
      } catch (cloudinaryError) {
        return res.status(502).json({
          success: false,
          error: `Cloudinary deletion failed: ${cloudinaryError.message}`,
        });
      }
    }

    await Gallery.findByIdAndDelete(photo._id);

    if (photo.collectionId) {
      await notifyCollectionParticipants({
        collectionId: photo.collectionId,
        actorId: userId,
        type: "photo_deleted",
        title: "Photo deleted",
        message: "A photo was deleted from the collection.",
        entityType: "photo",
        entityId: photo._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image deleted from Cloudinary and database.",
    });
  } catch (error) {
    return handleGalleryError(res, error, "Failed to delete image.");
  }
};

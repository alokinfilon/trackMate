const mongoose = require("mongoose");
const Gallery = require("../models/gallery.model");
const User = require("../models/user");
// Function 1: Handle incoming image variables and save metadata record
exports.uploadPhoto = async (req, res) => {
  try {
    const { tripId } = req.params; // Grabs the trip reference context from the route URL path
    const { caption, accessibility } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id); // Extracted securely from your auth token stream

    // 1. Core Validation: Check if Multer successfully pushed the file stream to Cloudinary
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        error: "Image upload failed: Missing binary image attachment payload."
      });
    }

    // 2. Grabs the resulting secure web URL string returned directly from Cloudinary
    const imageUrl = req.file.path;

    // 3. Compile and build the metadata package document
    const newPhoto = new Gallery({
      userId,
      tripId: new mongoose.Types.ObjectId(tripId),
      imageUrl,
      caption: caption || "",
      accessibility: accessibility || "shared" // Defaults securely to shared group members
    });

    // 4. Save and commit safely back to your MongoDB cluster
    const savedPhoto = await newPhoto.save();

    return res.status(201).json({
      success: true,
      message: "Image uploaded and pinned to your trip gallery successfully!",
      data: savedPhoto
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "MongoDB execution failed during image mapping operations.",
      error: error.message
    });
  }
};

// Function 2: Fetch and deliver filtered group gallery image datasets
exports.getTripGallery = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // 1. Core Security Query Filtration:
    // A traveler can view an image inside this trip only if:
    // - The image is marked as 'public'
    // - The image is marked as 'shared' (visible to group trip members)
    // - The image is marked as 'private' BUT it strictly belongs to the requesting logged-in userId
    const queryCriteria = {
      tripId: new mongoose.Types.ObjectId(tripId),
      $or: [
        { accessibility: "public" },
        { accessibility: "shared" },
        { accessibility: "private", userId: userId }
      ]
    };

    // 2. Database Search & Sorting (Newest holiday snaps appear first)
    const photos = await Gallery.find(queryCriteria)
      .sort({ createdAt: -1 })
      .populate("userId", "email mobile"); // Populates uploader metadata details cleanly

    return res.status(200).json({
      success: true,
      count: photos.length,
      data: photos
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "MongoDB search failed while retrieving gallery records.",
      error: error.message
    });
  }
};

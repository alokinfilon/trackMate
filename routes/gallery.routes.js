const express = require('express');
const router = express.Router();

// 1. Import your business logic controller functions
const galleryController = require('../controllers/gallery.controller');

// 2. Import your existing security token gatekeeper middleware
const verifyUserAuth = require('../middleware/auth.middleware');

// 3. Import the configured Multer engine tool from your cloudinary settings file
const { upload } = require('../utils/cloudinary');

/**
 * @route   POST /api/gallery/:tripId
 * @desc    Uploads a binary image file straight to Cloudinary and registers metadata to MongoDB
 * @access  Private (Requires Bearer token header authorization)
 * 
 * Flow:
 * 1. Listens for incoming image upload packets matched with a tripId parameter.
 * 2. Executes verifyUserAuth to parse tokens and attach verified user details.
 * 3. Executes Multer engine to trap the multi-part binary data stream field named 'image'.
 * 4. Passes the generated cloud URL string straight to the controller logic.
 */
router.post('/:tripId', verifyUserAuth, upload.single('image'), galleryController.uploadPhoto);

/**
 * @route   GET /api/gallery/:tripId
 * @desc    Fetches and delivers the privacy-filtered sharing gallery dataset for a specific holiday
 * @access  Private (Requires Bearer token header authorization)
 */
router.get('/:tripId', verifyUserAuth, galleryController.getTripGallery);

module.exports = router;

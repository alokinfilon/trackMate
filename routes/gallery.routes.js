const express = require("express");
const router = express.Router();
const galleryController = require("../controllers/gallery.controller");
const verifyUserAuth = require("../middleware/auth.middleware");
const { uploadSingle } = require("../utils/cloudinary");

router.post("/collections", verifyUserAuth, galleryController.createCollection);
router.get("/collections", verifyUserAuth, galleryController.listCollections);
router.get("/collections/:collectionId", verifyUserAuth, galleryController.getCollection);
router.patch("/collections/:collectionId", verifyUserAuth, galleryController.updateCollection);
router.delete("/collections/:collectionId", verifyUserAuth, galleryController.deleteCollection);
router.post("/collections/:collectionId/share", verifyUserAuth, galleryController.shareCollection);
router.get("/collections/:collectionId/members", verifyUserAuth, galleryController.listCollectionMembers);
router.delete("/collections/:collectionId/members/:memberId", verifyUserAuth, galleryController.revokeCollectionAccess);

router.get("/images/:imageId", verifyUserAuth, galleryController.getImageById);
router.patch("/images/:imageId/collection", verifyUserAuth, galleryController.assignImageToCollection);
router.delete("/images/:imageId", verifyUserAuth, galleryController.deleteImage);

router.post("/:tripId", verifyUserAuth, uploadSingle, galleryController.uploadPhoto);
router.get("/:tripId", verifyUserAuth, galleryController.getTripGallery);

module.exports = router;

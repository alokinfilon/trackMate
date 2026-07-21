const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const config = require("./config");

if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
  );
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "trackmate_gallery",
    transformation: [{ width: 1024, crop: "limit" }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
  },
});

const uploadSingle = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Image file is too large. Maximum size is 5MB."
          : err.message;
      return res.status(400).json({ success: false, error: message });
    }

    return res.status(400).json({ success: false, error: err.message });
  });
};

module.exports = {
  cloudinary,
  upload,
  uploadSingle,
};

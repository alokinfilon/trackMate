const express = require("express");
const router = express.Router();
const passport = require("../middleware/passport"); 
const {
  createUser,
  listUsers,
  loginUser,
  whoami,
  refreshToken,
  auth0LoginOrSignup,
  getProfile,     // ✅ Imported
  updateProfile   // ✅ Imported
} = require("../controllers/auth");
const validator = require("../middleware/validator");
const { uploadSingle } = require("../utils/cloudinary"); // ✅ Import Cloudinary upload middleware

router
  .route("/register")
  .post(validator.userValidationRules, validator.validate, createUser);

router
  .route("/login")
  .post(validator.loginValidationRules, validator.validate, loginUser);

router
  .route("/token/refresh")
  .post(
    validator.refreshTokenValidationRules,
    validator.validate,
    refreshToken
  );

router
  .route("/auth0-sync")
  .post(auth0LoginOrSignup);

router
  .route("/whoami")
  .get(passport.authenticate(["jwt", "basic"], { session: false }), whoami);

// ✅ NEW: Profile Management Endpoints
router
  .route("/profile")
  .get(
    passport.authenticate(["jwt", "basic"], { session: false }), 
    getProfile
  )
  .put(
    passport.authenticate(["jwt", "basic"], { session: false }), 
    uploadSingle, // Expects multipart/form-data with field name 'image'
    updateProfile
  );

module.exports = router;
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
  getProfile,     
  updateProfile,
  getPreferences,   // ✅ Imported preferences getter
  updatePreferences, // ✅ Imported preferences updater
  updatePassword,
} = require("../controllers/auth");
const validator = require("../middleware/validator");
const { uploadSingle } = require("../utils/cloudinary"); 

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

// Profile Management Endpoints
router
  .route("/profile")
  .get(
    passport.authenticate(["jwt", "basic"], { session: false }), 
    getProfile
  )
  .put(
    passport.authenticate(["jwt", "basic"], { session: false }), 
    uploadSingle, 
    updateProfile
  );

// ✅ NEW: Travel Preferences Management Endpoints
router
  .route("/preferences")
  .get(
    passport.authenticate(["jwt", "basic"], { session: false }), 
    getPreferences
  )
  .put(
    passport.authenticate(["jwt", "basic"], { session: false }), 
    updatePreferences
  );

router
  .route("/password")
  .put(
    passport.authenticate(["jwt", "basic"], { session: false }),
    validator.updatePasswordValidationRules,
    validator.validate,
    updatePassword
  );

module.exports = router;

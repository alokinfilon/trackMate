const express = require("express");
const router = express.Router();
const passport = require("../middleware/passport"); 
const {
  createUser,
  listUsers,
  loginUser,
  whoami,
  refreshToken,
  auth0LoginOrSignup
} = require("../controllers/auth");
const validator = require("../middleware/validator");

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

module.exports = router;

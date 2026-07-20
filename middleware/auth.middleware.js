const jwt = require("jsonwebtoken");
const config = require("../utils/config"); // 🎯 Imports your exact secret key configuration

/**
 * Gatekeeping Middleware: verifyUserAuth
 * Intercepts incoming network calls to validate tokens securely.
 */
const verifyUserAuth = (req, res, next) => {
  try {
    // 1. Header Extraction
    const authHeader = req.headers["authorization"];

    // 2. Token Discovery Check
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access Denied: No token provided or invalid authorization format."
      });
    }

    // Isolate the raw token string from the Bearer prefix
    const token = authHeader.split(" ")[1];

    // 3. Cryptographic Verification
    // Uses your verified config.SECRET to match your login system signature perfectly
    const decodedTokenData = jwt.verify(token, config.SECRET);

    // 4. Runtime State Injection
    // Maps your existing token keys ({ email, mobile, id }) straight into memory
    req.user = decodedTokenData; 

    // 5. Chain Advancement
    next();

  } catch (error) {
    // Blocks requests immediately if tokens are expired (over 10 mins) or tampered with
    return res.status(401).json({
      success: false,
      error: `Access Denied: Authentication token is invalid or expired. ${error.message}`
    });
  }
};

module.exports = verifyUserAuth;

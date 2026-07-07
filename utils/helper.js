const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("./config");
const { v4: uuidv4 } = require('uuid'); 
const RefreshToken = require("../models/refreshToken");
const saltRounds = 10;

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(saltRounds);
  const passwordHash = await bcrypt.hash(password, salt);
  return passwordHash;
}

async function comparePassword(password, hashPassword) {
  return await bcrypt.compare(password, hashPassword);
}

function issueAccessToken(payload) {
    return jwt.sign(payload, config.SECRET, { expiresIn: 60 * 10}); 
}

async function createRefreshToken(userId) {
    let expiryDate = new Date()
    expiryDate.setSeconds(60 * 60 * 24) 
    const token = uuidv4() 
    const refreshToken = await RefreshToken.create({
        token,
        user: userId,
        expiryDate: expiryDate.getTime()
    })
    return refreshToken.token
}

function verifyRefreshTokenExpiration (token) {
    return token.expiryDate.getTime() < new Date().getTime();
}

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 

  if (!token) {
    return res.status(401).json({ type: "Unauthorized", msg: "Access Token Missing" });
  }

  jwt.verify(token, config.SECRET, (err, decodedPayload) => {
    if (err) {
      return res.status(403).json({ type: "Forbidden", msg: "Invalid or Expired Token" });
    }
    
    req.user = decodedPayload; 
    next(); 
  });
}

/**
 * Parses and evaluates if an identifier input is a valid email or mobile number
 * @param {string} input - The raw text entered by the user
 * @returns {{ type: string|null, value: string|null, error: string|null }}
 */
function parseIdentifier(input) {
  if (!input || typeof input !== 'string') {
    return { type: null, value: null, error: "Identifier must be a non-empty string" };
  }

  const cleaned = input.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^\+?[1-9]\d{1,14}$/;

  if (emailRegex.test(cleaned)) {
    return { type: "email", value: cleaned.toLowerCase(), error: null };
  }

  if (mobileRegex.test(cleaned)) {
    return { type: "mobile", value: cleaned, error: null };
  }

  return { type: null, value: null, error: "Must be a valid email address or mobile number" };
}

module.exports = {
  hashPassword,
  comparePassword,
  issueAccessToken,
  createRefreshToken,
  verifyRefreshTokenExpiration,
  verifyToken,
  parseIdentifier 
};

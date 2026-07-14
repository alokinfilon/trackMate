const User = require("../models/user");
const helper = require("../utils/helper");
const RefreshToken = require("../models/refreshToken");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const axios = require("axios"); // Added to support direct Auth0 server-to-server validation

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

async function listUsers(req, res) {
  const users = await User.find({}).exec();
  return res.status(200).json(users);
}

async function createUser(req, res) {
  const { identifier, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  const { type, value, error } = helper.parseIdentifier(identifier);
  if (error) {
    return res.status(400).json({ error: error });
  }

  const passwordHash = await helper.hashPassword(password);

  const user = await User.create({
    [type]: value, 
    password: passwordHash,
  });

  return res.status(201).json(user);
}

async function loginUser(req, res) {
  const { identifier, password } = req.body;

  const { type, value, error } = helper.parseIdentifier(identifier);
  if (error) {
    return res.status(400).json({ error: error });
  }

  const user = await User.findOne({ [type]: value });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isPasswordCorrect = await helper.comparePassword(
    password,
    user.password,
  );

  if (!isPasswordCorrect) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const payload = {
    email: user.email || null,
    mobile: user.mobile || null,
    id: user.id,
  };

  const accessToken = helper.issueAccessToken(payload);
  const refreshToken = await helper.createRefreshToken(user.id);
  
  return res.status(200).json({
    accessToken,
    refreshToken,
    userId: user.id
  });
}

async function refreshToken(req, res) {
  const { refreshToken: refreshTokenUUID } = req.body; 
  const refreshToken = await RefreshToken.findOne({
    token: refreshTokenUUID,
  }).populate("user");

  if (!refreshToken) {
    return res.status(404).json({ error: "invalid refresh token" });
  }

  const isExpired = helper.verifyRefreshTokenExpiration(refreshToken);

  if (isExpired) {
    await RefreshToken.findByIdAndDelete(refreshToken._id).exec();
    return res.status(403).json({ error: "Refresh token is expired" });
  }

  const payload = {
    email: refreshToken.user.email || null,
    mobile: refreshToken.user.mobile || null,
    id: refreshToken.user.id,
  };

  await RefreshToken.findByIdAndDelete(refreshToken._id).exec();
  const newAccessToken = helper.issueAccessToken(payload);
  const newRefreshToken = await helper.createRefreshToken(payload.id);

  return res.status(200).json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    userId: payload.id
  });
}

async function whoami(req, res) {
  return res.status(200).json(req.user);
}

/**
 * Validates an Auth0 Identity token or Access token, logs in or registers the user in MongoDB,
 * and issues native ecosystem JWT sessions.
 */
/**
 * Validates an Auth0 Identity token or Access token, logs in or registers the user in MongoDB,
 * and issues native ecosystem JWT sessions.
 */
async function auth0LoginOrSignup(req, res) {
  // 1. First, look for the token in the standard HTTP Authorization Header
  let tokenToVerify = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    tokenToVerify = authHeader.split(" ")[1]; // Extracts the token string
  }

  // 2. Fallback: If not found in headers, check the request body (keeps older routes working)
  if (!tokenToVerify) {
    const { idToken, accessToken } = req.body;
    tokenToVerify = idToken || accessToken;
  }

  // If no token is found in headers OR body, reject early
  if (!tokenToVerify) {
    return res.status(400).json({ 
      error: "Auth0 Token is missing. Provide it via Bearer token header or request body." 
    });
  }

  // 3. Decode token profile properties without verification checks for visibility
  const unverifiedDecoded = jwt.decode(tokenToVerify);
  console.log("--- DEBUGGING AUTH0 PAYLOAD ---");
  console.log("Token Audience (aud):", unverifiedDecoded?.aud);
  console.log("Token Issuer (iss):", unverifiedDecoded?.iss);
  console.log("User Email inside Token:", unverifiedDecoded?.email || "undefined");
  console.log("--------------------------------");

  // If we detect an Access Token (Audience is an API URL like your Render URL instead of a Client ID string)
  // or if the email is undefined, we use the bulletproof UserInfo fetching route
  if (!unverifiedDecoded?.email || String(unverifiedDecoded?.aud).startsWith("http")) {
    console.log("Detecting Access Token or missing email profile. Fetching directly from Auth0 UserInfo endpoint...");
    try {
      const userInfoResponse = await axios.get(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      });
      return proceedWithSync(userInfoResponse.data, res);
    } catch (apiError) {
      console.error("Auth0 UserInfo endpoint communication failure:", apiError.response?.data || apiError.message);
      return res.status(401).json({ error: "Failed to authenticate session token via Auth0 server verification lookup." });
    }
  }

  // 4. Fallback: Verify the standard cryptographic RS256 token signature 
  jwt.verify(
    tokenToVerify,
    getKey,
    {
      audience: process.env.AUTH0_CLIENT_ID,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ["RS256"],
    },
    async (err, decodedAuth0User) => {
      if (err) {
        console.error("Auth0 Cryptographic Signature Check Failed:", err.message);
        return res.status(401).json({ error: `Invalid or expired Auth0 token: ${err.message}` });
      }
      return proceedWithSync(decodedAuth0User, res);
    }
  );
}


// Internal processor to map profile metadata variables and update MongoDB
async function proceedWithSync(decodedAuth0User, res) {
  try {
    const emailValue = decodedAuth0User.email ? decodedAuth0User.email.toLowerCase() : null;

    if (!emailValue) {
      return res.status(400).json({ error: "Email field missing from Auth0 authentication claim." });
    }

    // Cross-reference user data record within MongoDB cluster
    let user = await User.findOne({ email: emailValue });

    if (!user) {
      user = await User.create({
        email: emailValue,
        auth0Id: decodedAuth0User.sub, 
      });
      console.log(`New Auth0 user registered in DB: ${user.email}`);
    } else if (!user.auth0Id) {
      user.auth0Id = decodedAuth0User.sub;
      await user.save();
      console.log(`Linked existing credentials account profile to Auth0 ID: ${user.email}`);
    } else {
      console.log(`Existing Auth0 user logged in: ${user.email}`);
    }

    const payload = {
      email: user.email || null,
      mobile: user.mobile || null,
      id: user.id,
    };

    const accessToken = helper.issueAccessToken(payload);
    const refreshToken = await helper.createRefreshToken(user.id);

    return res.status(200).json({
      accessToken,
      refreshToken,
      userId: user.id,
    });

  } catch (dbError) {
    console.error("MongoDB Auth0 Sync Error:", dbError.message);
    return res.status(500).json({ error: `Internal database processing failure: ${dbError.message}` });
  }
}

module.exports = {
  createUser,
  listUsers,
  loginUser,
  whoami,
  refreshToken,
  auth0LoginOrSignup, 
};

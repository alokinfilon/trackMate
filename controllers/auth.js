const User = require("../models/user");
const helper = require("../utils/helper");
const RefreshToken = require("../models/refreshToken");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const axios = require("axios"); 

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


async function auth0LoginOrSignup(req, res) {
  try {
    let tokenToVerify = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      tokenToVerify = authHeader.substring(7).trim(); 
    }

    if (!tokenToVerify) {
      const { idToken, accessToken } = req.body;
      tokenToVerify = idToken || accessToken;
    }

    if (!tokenToVerify || tokenToVerify === "undefined" || tokenToVerify === "null") {
      return res.status(400).json({ 
        error: "Auth0 Token is missing or malformed. Provide it via Bearer token header or request body." 
      });
    }

    const unverifiedDecoded = jwt.decode(tokenToVerify);
    if (!unverifiedDecoded) {
      return res.status(400).json({ error: "Failed to decode malformed JWT token structure." });
    }

    console.log("--- DEBUGGING AUTH0 PAYLOAD ---");
    console.log("Token Audience (aud):", unverifiedDecoded?.aud);
    console.log("Token Issuer (iss):", unverifiedDecoded?.iss);
    console.log("User Email inside Token:", unverifiedDecoded?.email || "undefined");
    console.log("--------------------------------");

    if (!unverifiedDecoded?.email || String(unverifiedDecoded?.aud).startsWith("http")) {
      console.log("Detecting Access Token or missing email profile. Fetching directly from Auth0 UserInfo endpoint...");
      try {
        const userInfoResponse = await axios.get(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
          headers: { Authorization: `Bearer ${tokenToVerify}` }
        });
        return await proceedWithSync(userInfoResponse.data, res);
      } catch (apiError) {
        console.error("Auth0 UserInfo endpoint communication failure:", apiError.response?.data || apiError.message);
        return res.status(401).json({ error: "Failed to authenticate session token via Auth0 server verification lookup." });
      }
    }
    const decodedAuth0User = await new Promise((resolve, reject) => {
      jwt.verify(
        tokenToVerify,
        getKey,
        {
          audience: process.env.AUTH0_CLIENT_ID,
          issuer: `https://${process.env.AUTH0_DOMAIN}/`,
          algorithms: ["RS256"],
        },
        (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded);
        }
      );
    });

    return await proceedWithSync(decodedAuth0User, res);

  } catch (error) {
    console.error("Auth0 Verification Middleware Pipeline Failure:", error.message);
    return res.status(401).json({ error: `Invalid or expired Auth0 token: ${error.message}` });
  }
}




async function proceedWithSync(decodedAuth0User, res) {
  try {
    const emailValue = decodedAuth0User.email ? decodedAuth0User.email.toLowerCase() : null;

    if (!emailValue) {
      return res.status(400).json({ error: "Email field missing from Auth0 authentication claim." });
    }

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


async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { full_name, country } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    if (full_name !== undefined) {
      user.full_name = String(full_name).trim();
    }
    if (country !== undefined) {
      user.country = String(country).trim();
    }

    if (req.file && req.file.path) {
      user.user_image = req.file.path;
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Get User Preferences
async function getPreferences(req, res) {
  try {
    const user = await User.findById(req.user.id).select("preferences");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    return res.status(200).json({
      success: true,
      data: user.preferences || {},
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update / Save User Preferences (Supports multi-step or full-payload saves)
async function updatePreferences(req, res) {
  try {
    const userId = req.user.id;
    const incomingPreferences = req.body; // e.g. { fav_country: ["in", "jp"] }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    // Initialize preferences object if it doesn't exist
    if (!user.preferences) {
      user.preferences = {};
    }

    // Merge or update incoming preference categories
    Object.keys(incomingPreferences).forEach((category) => {
      if (Array.isArray(incomingPreferences[category])) {
        user.preferences[category] = incomingPreferences[category];
      }
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Preferences updated successfully.",
      data: user.preferences,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function updatePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        error: "currentPassword, newPassword, and confirmNewPassword are required.",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        error: "New passwords do not match.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: "Password update is not available for Auth0-linked accounts.",
      });
    }

    const isCurrentPasswordValid = await helper.comparePassword(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect.",
      });
    }

    user.password = await helper.hashPassword(newPassword);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createUser,
  listUsers,
  loginUser,
  whoami,
  refreshToken,
  auth0LoginOrSignup, 
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
  updatePassword,
};

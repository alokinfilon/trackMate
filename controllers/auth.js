const User = require("../models/user");
const helper = require("../utils/helper");
const RefreshToken = require("../models/refreshToken");

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

module.exports = {
  createUser,
  listUsers,
  loginUser,
  whoami,
  refreshToken,
};

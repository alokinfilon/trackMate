const jwt = require("jsonwebtoken");
const config = require("../utils/config");
const User = require("../models/user");
const helper = require("../utils/helper");

const verifyStrategy = async (strategy, req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  if (strategy === "jwt" && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, config.SECRET);
      const user = await User.findOne({ _id: decoded.id });
      return user || null;
    } catch {
      return null;
    }
  }

  if (strategy === "basic" && authHeader.startsWith("Basic ")) {
    try {
      const credentialsBlob = authHeader.split(" ")[1];
      const credentials = Buffer.from(credentialsBlob, "base64").toString("ascii");
      
      const [identifier, password] = credentials.split(":");
      
      const { type, value, error } = helper.parseIdentifier(identifier);
      if (error) return null; 

      const user = await User.findOne({ [type]: value });
      if (!user) return null;

      const isPasswordCorrect = await helper.comparePassword(password, user.password);
      return isPasswordCorrect ? user : null;
    } catch {
      return null;
    }
  }

  return null;
};

const authenticate = (strategies) => {
  return async (req, res, next) => {
    const strategyList = Array.isArray(strategies) ? strategies : [strategies];

    for (const strategy of strategyList) {
      const user = await verifyStrategy(strategy, req);
      if (user) {
        req.user = user; 
        return next();  
      }
    }

    return res.status(401).json({ message: "Unauthorized" });
  };
};

module.exports = {
  authenticate: (strategies, options) => authenticate(strategies),
};

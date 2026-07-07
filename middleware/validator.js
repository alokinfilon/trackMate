const userValidationRules = (req, res, next) => {
  const { identifier, password, confirmPassword } = req.body;
  const errors = [];

  
  if (!identifier) {
    errors.push({ identifier: "Email or mobile number is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const mobileRegex = /^(\+\d{1,3})?\d{10}$/;

    if (!emailRegex.test(identifier) && !mobileRegex.test(identifier)) {
      errors.push({ identifier: "Must be a valid email address or 10-digit mobile number" });
    }
  }

  if (!password) {
    errors.push({ password: "Password is required" });
  } else if (typeof password !== "string") {
    errors.push({ password: "Password must be a string" });
  }

  if (!confirmPassword) {
    errors.push({ confirmPassword: "Confirm password is required" });
  } else if (typeof confirmPassword !== "string") {
    errors.push({ confirmPassword: "  Confirm password must be a string" });
  } else if (confirmPassword !== password) {
    errors.push({ confirmPassword: "Passwords do not match" });
  }

  req.validationErrors = errors;
  next();
};

const loginValidationRules = (req, res, next) => {
  const { identifier, password } = req.body;
  const errors = [];

  if (!identifier) {
    errors.push({ identifier: "Email or mobile number is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\+?[1-9]\d{1,14}$/;

    if (!emailRegex.test(identifier) && !mobileRegex.test(identifier)) {
      errors.push({ identifier: "Must be a valid email address or mobile number" });
    }
  }

  if (!password) {
    errors.push({ password: "Password is required" });
  } else if (typeof password !== "string") {
    errors.push({ password: "Password must be a string" });
  }

  req.validationErrors = errors;
  next();
};

const refreshTokenValidationRules = (req, res, next) => {
  const { refreshToken } = req.body;
  const errors = [];

  if (!refreshToken) {
    errors.push({ refreshToken: "Refresh token is required" });
  } else {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(refreshToken)) {
      errors.push({ refreshToken: "Refresh token must be a valid UUID" });
    }
  }

  req.validationErrors = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req.validationErrors || [];

  if (errors.length === 0) {
    return next();
  }

  return res.status(422).json({ errors });
};

module.exports = {
  userValidationRules,
  loginValidationRules,
  refreshTokenValidationRules,
  validate,
};



// const { body, validationResult } = require("express-validator");

// const userValidationRules = [
//   body("email")
//     .notEmpty().withMessage("Email is required")
//     .isEmail().withMessage("Must be a valid email address"),
  
//   body("password")
//     .notEmpty().withMessage("Password is required")
//     .isString(),
    
//   body("confirmPassword")
//     .notEmpty().withMessage("Confirm password is required")
//     .isString()
//     .custom((value, { req }) => {
//       if (value !== req.body.password) {
//         throw new Error("Passwords do not match");
//       }
//       return true;
//     }),
// ];

// const validate = (req, res, next) => {
//   const errors = validationResult(req);
//   const errorsArray = [];
//   errors.array().map(err => errorsArray.push({ [err.path]: err.msg }));
//   if (errors.isEmpty()) {
//     return next();
//   }
//   return res.status(422).json({ errors: errorsArray });
// };

// const loginValidationRules = [
//     body("email").notEmpty().isEmail(),
//     body("password").notEmpty().isString()
// ];

// const refreshTokenValidationRules = [
//     body('refreshToken').notEmpty().isUUID()
// ];

// module.exports = {
//   userValidationRules,
//   loginValidationRules,
//   refreshTokenValidationRules,
//   validate,
// };

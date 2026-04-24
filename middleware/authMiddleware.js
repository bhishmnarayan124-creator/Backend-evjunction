const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* =========================================================
   PROTECT ROUTE (LOGIN REQUIRED)
========================================================= */

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, token missing",
      });
    }

    // VERIFY TOKEN
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // CHECK USER EXISTS
    const user = await User.findById(decoded.sub).select(
      "_id name email role isActive"
    );

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // CHECK USER ACTIVE STATUS
    if (user.isActive === false) {
      return res.status(403).json({
        message: "Account disabled. Contact admin.",
      });
    }

    // ATTACH USER TO REQUEST
    req.user = user;

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }

    return res.status(401).json({
      message: "Not authorized, token invalid",
    });
  }
};

/* =========================================================
   ROLE BASED ACCESS CONTROL
========================================================= */

exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(
          ", "
        )}`,
      });
    }

    next();
  };
};

/* =========================================================
   OWNER OR ADMIN ACCESS (VERY USEFUL)
========================================================= */

exports.ownerOrAdmin = (model) => {
  return async (req, res, next) => {
    try {
      const doc = await model.findById(req.params.id);

      if (!doc) {
        return res.status(404).json({
          message: "Resource not found",
        });
      }

      if (
        doc.createdBy?.toString() !==
          req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message:
            "Access denied. Not resource owner.",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        message: "Authorization failed",
        error: error.message,
      });
    }
  };
};
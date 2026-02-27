// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function getTokenFromHeader(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

/**
 * protect:
 * - verifies JWT
 * - loads user
 * - sets req.user = { id, role, customer }
 */
const protect = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select("_id role customer email");
    if (!user) return res.status(401).json({ message: "Invalid token (user not found)" });

    req.user = {
      id: String(user._id),
      role: user.role,
      customer: user.customer ? String(user.customer) : null,
      email: user.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * requireRole("admin")
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};

/**
 * requireCustomerOwnership:
 * Use when a route includes :customerId
 * - admin can access anything
 * - customer can only access their own customerId
 */
const requireCustomerOwnership = (paramName = "customerId") => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (req.user.role === "admin") return next();

    const customerId = req.params[paramName];
    if (!req.user.customer) return res.status(403).json({ message: "Forbidden" });

    if (String(customerId) !== String(req.user.customer)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};

module.exports = {
  protect,
  requireRole,
  requireCustomerOwnership,
};

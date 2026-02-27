// src/controllers/auth.controller.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const asyncHandler = require("../utils/asyncHandler");

const User = require("../models/User");
const Customer = require("../models/Customer");

const normalizeEmail = require("../utils/normalizeEmail"); // you already have this

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error("JWT secret not configured");
    err.statusCode = 500;
    throw err;
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: userId }, secret, { expiresIn });
}

/**
 * POST /api/auth/register
 * body: { name, email, password, address, phone }
 * - creates Customer
 * - creates User linked to Customer
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, address, phone } = req.body;

  if (!name || !email || !password || !address || !phone) {
    const err = new Error("Missing required fields");
    err.statusCode = 400;
    throw err;
  }

  const emailNorm = normalizeEmail(email);

  const existingUser = await User.findOne({ email: emailNorm });
  const existingCustomer = await Customer.findOne({ email: emailNorm });

  if (existingUser || existingCustomer) {
    const err = new Error("An account with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const customer = await Customer.create({
    name,
    email: emailNorm,
    address,
    phone,
  });

  const user = await User.create({
    email: emailNorm,
    passwordHash,
    role: "customer",
    customer: customer._id,
  });

  const token = signToken(user._id);

  res.status(201).json({
    message: "registered",
    payload: {
      token,
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        customer: String(customer._id),
      },
      customer,
    },
  });
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const err = new Error("Email and password are required");
    err.statusCode = 400;
    throw err;
  }

  const emailNorm = normalizeEmail(email);

  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user._id);

  res.json({
    message: "logged in",
    payload: {
      token,
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        customer: user.customer ? String(user.customer) : null,
      },
    },
  });
});

/**
 * GET /api/auth/me
 * Requires Authorization: Bearer <token>
 */
const me = asyncHandler(async (req, res) => {
  // protect() already set req.user = { id, role, customer, email }
  const user = await User.findById(req.user.id).select("_id email role customer");
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const customer = user.customer ? await Customer.findById(user.customer) : null;

  res.json({
    message: "success",
    payload: {
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        customer: user.customer ? String(user.customer) : null,
      },
      customer,
    },
  });
});

/**
 * POST /api/auth/admin/create
 * Admin-only. Creates a user with role + optional customer link.
 * body: { email, password, role, customerId? }
 */
const adminCreateUser = asyncHandler(async (req, res) => {
  const { email, password, role, customerId } = req.body;

  if (!email || !password || !role) {
    const err = new Error("email, password, and role are required");
    err.statusCode = 400;
    throw err;
  }

  const allowed = new Set(["admin", "customer"]);
  if (!allowed.has(role)) {
    const err = new Error("Invalid role");
    err.statusCode = 400;
    throw err;
  }

  const emailNorm = normalizeEmail(email);

  const existing = await User.findOne({ email: emailNorm });
  if (existing) {
    const err = new Error("User already exists");
    err.statusCode = 409;
    throw err;
  }

  let customer = null;
  if (customerId) {
    const exists = await Customer.exists({ _id: customerId });
    if (!exists) {
      const err = new Error("Customer not found");
      err.statusCode = 404;
      throw err;
    }
    customer = customerId;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    email: emailNorm,
    passwordHash,
    role,
    customer,
  });

  res.status(201).json({
    message: "created",
    payload: {
      id: String(user._id),
      email: user.email,
      role: user.role,
      customer: user.customer ? String(user.customer) : null,
    },
  });
});

module.exports = {
  register,
  login,
  me,
  adminCreateUser,
};

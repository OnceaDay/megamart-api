// src/controllers/customers.controller.js

const Customer = require("../models/Customer");

const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../utils/validateObjectId");
const normalizeEmail = require("../utils/normalizeEmail");

// GET /api/customers
const getCustomers = asyncHandler(async (req, res) => {
  const { email, name, sort } = req.query;

  const filter = {};

  // Optional filters
  if (email) filter.email = normalizeEmail(email);
  if (name) filter.name = new RegExp(String(name).trim(), "i"); // simple contains search

  // Sorting (safe allowlist)
  let sortObj = { createdAt: -1 };
  if (sort) {
    sortObj = {};
    const fields = String(sort)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const allowed = new Set(["name", "email", "createdAt", "updatedAt"]);
    for (const f of fields) {
      const dir = f.startsWith("-") ? -1 : 1;
      const key = f.replace(/^-/, "");
      if (allowed.has(key)) sortObj[key] = dir;
    }

    if (Object.keys(sortObj).length === 0) sortObj = { createdAt: -1 };
  }

  const customers = await Customer.find(filter).sort(sortObj);

  res.json({
    message: "success",
    results: customers.length,
    payload: customers,
  });
});

// GET /api/customers/:id
const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  validateObjectId(id, "customer id");

  const customer = await Customer.findById(id);

  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ message: "success", payload: customer });
});

// POST /api/customers
const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, address, phone } = req.body;

  const cleanEmail = normalizeEmail(email);

  // Basic guardrails (Mongoose will validate too, but this gives nicer errors)
  if (!name || !cleanEmail || !address || !phone) {
    const err = new Error("name, email, address, and phone are required");
    err.statusCode = 400;
    throw err;
  }

  try {
    const customer = await Customer.create({
      name,
      email: cleanEmail,
      address,
      phone,
    });

    res.status(201).json({ message: "created", payload: customer });
  } catch (e) {
    // Duplicate email error (Mongo)
    if (e && e.code === 11000) {
      const err = new Error("Email already exists");
      err.statusCode = 409;
      throw err;
    }
    throw e;
  }
});

// PATCH /api/customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  validateObjectId(id, "customer id");

  // If email is being updated, normalize it
  if (req.body.email !== undefined) {
    req.body.email = normalizeEmail(req.body.email);
  }

  try {
    const updated = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      const err = new Error("Customer not found");
      err.statusCode = 404;
      throw err;
    }

    res.json({ message: "updated", payload: updated });
  } catch (e) {
    if (e && e.code === 11000) {
      const err = new Error("Email already exists");
      err.statusCode = 409;
      throw err;
    }
    throw e;
  }
});

// DELETE /api/customers/:id
const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  validateObjectId(id, "customer id");

  const deleted = await Customer.findByIdAndDelete(id);

  if (!deleted) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ message: "deleted", payload: deleted });
});

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};

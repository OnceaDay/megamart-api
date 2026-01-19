// src/controllers/products.controller.js

const Product = require("../models/Product");

const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../utils/validateObjectId");

/**
 * GET /api/products
 * Supports:
 *  - category=tech
 *  - minPrice=10&maxPrice=100
 *  - inStock=true
 *  - sort=price | -price | name | -name | category | -category | createdAt | -createdAt
 *  - page=1&limit=20 (optional pagination)
 */
const getProducts = asyncHandler(async (req, res) => {
  const { category, minPrice, maxPrice, inStock, sort, page, limit } = req.query;

  const filter = {};

  if (category) {
    filter.category = String(category).toLowerCase().trim();
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  // inStock=true => stock > 0
  if (inStock !== undefined) {
    const val = String(inStock).toLowerCase();
    if (val === "true") filter.stock = { $gt: 0 };
    if (val === "false") filter.stock = { $gte: 0 }; // basically no-op but explicit
  }

  // Sorting
  // Accept: "price" or "-price" or "name" or "-name" etc.
  // Also accept comma-separated: sort=category,-price
  let sortObj = { createdAt: -1 };
  if (sort) {
    sortObj = {};
    const fields = String(sort)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const allowed = new Set([
      "price",
      "name",
      "category",
      "stock",
      "createdAt",
      "updatedAt",
    ]);

    for (const f of fields) {
      const dir = f.startsWith("-") ? -1 : 1;
      const key = f.replace(/^-/, "");
      if (allowed.has(key)) sortObj[key] = dir;
    }

    // If user passed only invalid fields, fall back
    if (Object.keys(sortObj).length === 0) sortObj = { createdAt: -1 };
  }

  // Optional pagination
  const pageNum = Math.max(Number(page || 1), 1);
  const limitNum = Math.min(Math.max(Number(limit || 0), 0), 100); // cap at 100
  const skip = limitNum ? (pageNum - 1) * limitNum : 0;

  const query = Product.find(filter).sort(sortObj);
  if (limitNum) query.skip(skip).limit(limitNum);

  const products = await query;

  res.json({
    message: "success",
    results: products.length,
    payload: products,
  });
});

/**
 * GET /api/products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  validateObjectId(id, "product id");

  const product = await Product.findById(id);

  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ message: "success", payload: product });
});

/**
 * POST /api/products
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock, images } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    category,
    stock,
    images,
  });

  res.status(201).json({ message: "created", payload: product });
});

/**
 * PATCH /api/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  validateObjectId(id, "product id");

  const updated = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ message: "updated", payload: updated });
});

/**
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  validateObjectId(id, "product id");

  const deleted = await Product.findByIdAndDelete(id);

  if (!deleted) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ message: "deleted", payload: deleted });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

// src/controllers/products.controller.js

const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../utils/validateObjectId");

/**
 * Helpers
 */
const toBool = (v) => {
  if (v === undefined) return undefined;
  const s = String(v).toLowerCase().trim();
  if (s === "true") return true;
  if (s === "false") return false;
  return undefined;
};

const toNum = (v) => {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const escapeRegex = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GET /api/products
 * Supports:
 *  - roomType, category, subcategory
 *  - priorityLevel, budgetTier, spaceRequirement
 *  - minPrice, maxPrice
 *  - inStock=true|false (uses quantityAvailable)
 *  - sort=price|-price|name|-name|category|-category|createdAt|-createdAt|updatedAt|-updatedAt
 *  - q=searchTerm (searches name + shortDescription + tags)
 *  - page & limit (pagination)
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    roomType,
    category,
    subcategory,
    priorityLevel,
    budgetTier,
    spaceRequirement,
    minPrice,
    maxPrice,
    inStock,
    sort,
    page,
    limit,
    q,
  } = req.query;

  const filter = {};

  // NOTE: Do NOT toLowerCase() these because your enums are camelCase
  if (roomType) filter.roomType = String(roomType).trim();
  if (category) filter.category = String(category).trim();
  if (subcategory) filter.subcategory = String(subcategory).trim();
  if (priorityLevel) filter.priorityLevel = String(priorityLevel).trim();
  if (budgetTier) filter.budgetTier = String(budgetTier).trim();
  if (spaceRequirement) filter.spaceRequirement = String(spaceRequirement).trim();

  // Price range
  const min = toNum(minPrice);
  const max = toNum(maxPrice);
  if (min !== undefined || max !== undefined) {
    filter.price = {};
    if (min !== undefined) filter.price.$gte = min;
    if (max !== undefined) filter.price.$lte = max;
  }

  // inStock logic: your schema uses inStock + quantityAvailable
  const inStockBool = toBool(inStock);
  if (inStockBool === true) {
    filter.inStock = true;
    filter.quantityAvailable = { $gt: 0 };
  }
  if (inStockBool === false) {
    // show anything that is not sellable (either out of stock OR qty 0)
    filter.$or = [{ inStock: false }, { quantityAvailable: { $lte: 0 } }];
  }

  // #2 Search (q)
  if (q && String(q).trim()) {
    const term = escapeRegex(String(q).trim());
    const rx = new RegExp(term, "i");
    filter.$or = [
      ...(filter.$or || []),
      { name: rx },
      { shortDescription: rx },
      { tags: rx }, // matches any tag string in tags array
    ];
  }

  // Sorting
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
      "roomType",
      "subcategory",
      "priorityLevel",
      "budgetTier",
      "spaceRequirement",
      "createdAt",
      "updatedAt",
      "quantityAvailable",
    ]);

    for (const f of fields) {
      const dir = f.startsWith("-") ? -1 : 1;
      const key = f.replace(/^-/, "");
      if (allowed.has(key)) sortObj[key] = dir;
    }

    if (Object.keys(sortObj).length === 0) sortObj = { createdAt: -1 };
  }

  // Pagination
  const pageNum = Math.max(Number(page || 1), 1);
  const limitNum = Math.min(Math.max(Number(limit || 20), 1), 100);
  const skip = (pageNum - 1) * limitNum;

  // #1 total + pages metadata
  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sortObj).skip(skip).limit(limitNum),
  ]);

  const pages = Math.max(Math.ceil(total / limitNum), 1);

  res.json({
    message: "success",
    results: products.length,
    page: pageNum,
    limit: limitNum,
    total,
    pages,
    hasPrevPage: pageNum > 1,
    hasNextPage: pageNum < pages,
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
 * #3 GET /api/products/sku/:sku
 */
const getProductBySku = asyncHandler(async (req, res) => {
  const { sku } = req.params;

  const product = await Product.findOne({ sku: String(sku).trim() });

  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ message: "success", payload: product });
});

/**
 * Sanitizer/whitelist for create/update payloads
 * (pairs with #5 hardening)
 */
const pickProductFields = (body = {}) => {
  const out = {};

  const fields = [
    "sku",
    "name",
    "productType",
    "category",
    "subcategory",
    "roomType",
    "price",
    "currency",
    "priorityLevel",
    "budgetTier",
    "spaceRequirement",
    "inStock",
    "quantityAvailable",
    "tags",
    "accessibilityFeatures",
    "features",
    "shortDescription",
    "longDescription",
    "primaryImage",
    "galleryImages",
    "imageAltText",
    "bundleItems",
  ];

  for (const k of fields) {
    if (body[k] !== undefined) out[k] = body[k];
  }

  // normalize common string fields
  if (out.sku) out.sku = String(out.sku).trim();
  if (out.name) out.name = String(out.name).trim();
  if (out.shortDescription) out.shortDescription = String(out.shortDescription).trim();
  if (out.longDescription !== undefined) out.longDescription = String(out.longDescription || "").trim();
  if (out.primaryImage) out.primaryImage = String(out.primaryImage).trim();
  if (out.imageAltText !== undefined) out.imageAltText = String(out.imageAltText || "").trim();

  return out;
};

/**
 * POST /api/products
 */
const createProduct = asyncHandler(async (req, res) => {
  const payload = pickProductFields(req.body);

  const product = await Product.create(payload);

  res.status(201).json({ message: "created", payload: product });
});

/**
 * PUT /api/products/:id
 * (You can still send partial payloads; validators will enforce enums)
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateObjectId(id, "product id");

  const payload = pickProductFields(req.body);

  const updated = await Product.findByIdAndUpdate(id, payload, {
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
 * PATCH /api/products/:id/stock
 * Only updates quantityAvailable + inStock
 */
const updateProductStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateObjectId(id, "product id");

  const payload = {};
  if (req.body.quantityAvailable !== undefined) payload.quantityAvailable = Number(req.body.quantityAvailable);
  if (req.body.inStock !== undefined) payload.inStock = Boolean(req.body.inStock);

  const updated = await Product.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ message: "updated-stock", payload: updated });
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
  getProductBySku,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
};

// src/controllers/carts.controller.js

const Cart = require("../models/Cart");
const Customer = require("../models/Customer");
const Product = require("../models/Product");

const asyncHandler = require("../utils/asyncHandler");
const requireValidId = require("../utils/validateObjectId");
const calcCartTotal = require("../utils/calculateCartTotal");

// GET /api/carts/:customerId
const getCartByCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  requireValidId(customerId, "customerId");

  const cart = await Cart.findOne({ customer: customerId }).populate("items.productId");

  if (!cart) {
    // Create empty cart on first access (nice UX)
    const created = await Cart.create({ customer: customerId, items: [] });
    const populated = await Cart.findById(created._id).populate("items.productId");

    return res.json({
      message: "success",
      payload: {
        cart: populated,
        total: 0,
      },
    });
  }

  res.json({
    message: "success",
    payload: {
      cart,
      total: calcCartTotal(cart),
    },
  });
});

// POST /api/carts/:customerId/items
// body: { productId, quantity }
const addItemToCart = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { productId, quantity = 1 } = req.body;

  requireValidId(customerId, "customerId");
  requireValidId(productId, "productId");

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    const err = new Error("quantity must be a number >= 1");
    err.statusCode = 400;
    throw err;
  }

  // Ensure customer exists
  const customerExists = await Customer.exists({ _id: customerId });
  if (!customerExists) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }

  // Ensure product exists
  const productExists = await Product.exists({ _id: productId });
  if (!productExists) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  let cart = await Cart.findOne({ customer: customerId });

  if (!cart) {
    cart = await Cart.create({
      customer: customerId,
      items: [{ productId, quantity: qty }],
    });
  } else {
    const existing = cart.items.find((i) => String(i.productId) === String(productId));
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({ productId, quantity: qty });
    }
    await cart.save();
  }

  const populated = await Cart.findById(cart._id).populate("items.productId");

  res.status(201).json({
    message: "item added",
    payload: {
      cart: populated,
      total: calcCartTotal(populated),
    },
  });
});

// PATCH /api/carts/:customerId/items/:productId
// body: { quantity }
const updateCartItemQty = asyncHandler(async (req, res) => {
  const { customerId, productId } = req.params;
  const { quantity } = req.body;

  requireValidId(customerId, "customerId");
  requireValidId(productId, "productId");

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    const err = new Error("quantity must be a number >= 1");
    err.statusCode = 400;
    throw err;
  }

  const cart = await Cart.findOne({ customer: customerId });
  if (!cart) {
    const err = new Error("Cart not found");
    err.statusCode = 404;
    throw err;
  }

  const item = cart.items.find((i) => String(i.productId) === String(productId));
  if (!item) {
    const err = new Error("Item not found in cart");
    err.statusCode = 404;
    throw err;
  }

  item.quantity = qty;
  await cart.save();

  const populated = await Cart.findById(cart._id).populate("items.productId");

  res.json({
    message: "item updated",
    payload: {
      cart: populated,
      total: calcCartTotal(populated),
    },
  });
});

// DELETE /api/carts/:customerId/items/:productId
const removeItemFromCart = asyncHandler(async (req, res) => {
  const { customerId, productId } = req.params;

  requireValidId(customerId, "customerId");
  requireValidId(productId, "productId");

  const cart = await Cart.findOne({ customer: customerId });
  if (!cart) {
    const err = new Error("Cart not found");
    err.statusCode = 404;
    throw err;
  }

  const before = cart.items.length;
  cart.items = cart.items.filter((i) => String(i.productId) !== String(productId));

  if (cart.items.length === before) {
    const err = new Error("Item not found in cart");
    err.statusCode = 404;
    throw err;
  }

  await cart.save();

  const populated = await Cart.findById(cart._id).populate("items.productId");

  res.json({
    message: "item removed",
    payload: {
      cart: populated,
      total: calcCartTotal(populated),
    },
  });
});

// DELETE /api/carts/:customerId/clear
const clearCart = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  requireValidId(customerId, "customerId");

  const cart = await Cart.findOne({ customer: customerId });
  if (!cart) {
    const err = new Error("Cart not found");
    err.statusCode = 404;
    throw err;
  }

  cart.items = [];
  await cart.save();

  res.json({
    message: "cart cleared",
    payload: { cart, total: 0 },
  });
});

module.exports = {
  getCartByCustomer,
  addItemToCart,
  updateCartItemQty,
  removeItemFromCart,
  clearCart,
};

// src/controllers/orders.controller.js

const mongoose = require("mongoose");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Customer = require("../models/Customer");
const Product = require("../models/Product");

const asyncHandler = require("../utils/asyncHandler");
const requireValidId = require("../utils/validateObjectId");

/**
 * POST /api/orders/from-cart/:customerId
 * - pulls cart
 * - checks quantityAvailable
 * - decrements quantityAvailable (atomic)
 * - keeps inStock aligned
 * - creates order with item snapshots
 * - clears cart
 *
 * IMPORTANT: uses a MongoDB transaction so it's all-or-nothing.
 */
const placeOrderFromCart = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  requireValidId(customerId, "customerId");

  // Start a transaction session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customerExists = await Customer.exists({ _id: customerId }).session(session);
    if (!customerExists) {
      const err = new Error("Customer not found");
      err.statusCode = 404;
      throw err;
    }

    const cart = await Cart.findOne({ customer: customerId })
      .populate("items.productId")
      .session(session);

    if (!cart || cart.items.length === 0) {
      const err = new Error("Cart is empty");
      err.statusCode = 400;
      throw err;
    }

    const orderItems = [];
    let total = 0;

    for (const item of cart.items) {
      const productDoc = item.productId;

      if (!productDoc) {
        const err = new Error("A product in the cart no longer exists");
        err.statusCode = 409;
        throw err;
      }

      const qty = item.quantity;

      if (!Number.isFinite(qty) || qty <= 0) {
        const err = new Error(`Invalid quantity for product: ${productDoc.name}`);
        err.statusCode = 400;
        throw err;
      }

      /**
       * Atomic decrement (only if enough stock), AND keep inStock aligned.
       * Uses an update pipeline so inStock updates based on the new quantityAvailable.
       */
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productDoc._id, quantityAvailable: { $gte: qty } },
        [
          { $set: { quantityAvailable: { $subtract: ["$quantityAvailable", qty] } } },
          { $set: { inStock: { $gt: ["$quantityAvailable", 0] } } },
        ],
        { new: true, session }
      );

      if (!updatedProduct) {
        const err = new Error(`Insufficient stock for product: ${productDoc.name}`);
        err.statusCode = 409;
        throw err;
      }

      // Snapshot the price/name at time of purchase (from the updated doc)
      const price = updatedProduct.price;
      const lineTotal = price * qty;
      total += lineTotal;

      orderItems.push({
        productId: updatedProduct._id,
        name: updatedProduct.name,
        price,
        quantity: qty,
        lineTotal,
      });
    }

    const createdOrders = await Order.create(
      [
        {
          customer: customerId,
          items: orderItems,
          total,
          status: "pending",
        },
      ],
      { session }
    );

    // Clear cart after successful order creation
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "order placed",
      payload: createdOrders[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

/**
 * GET /api/orders
 * Optional query params:
 *  - customer=<customerId>
 *  - status=pending|shipped|delivered|cancelled
 *  - sort=createdAt|-createdAt|total|-total|status|-status
 */
const getOrders = asyncHandler(async (req, res) => {
  const { customer, status, sort } = req.query;

  const filter = {};
  if (customer) {
    requireValidId(customer, "customer");
    filter.customer = customer;
  }
  if (status) filter.status = status;

  let sortObj = { createdAt: -1 };
  if (sort) {
    sortObj = {};
    const allowed = new Set(["createdAt", "total", "status"]);
    const fields = String(sort)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const f of fields) {
      const dir = f.startsWith("-") ? -1 : 1;
      const key = f.replace(/^-/, "");
      if (allowed.has(key)) sortObj[key] = dir;
    }

    if (Object.keys(sortObj).length === 0) sortObj = { createdAt: -1 };
  }

  const orders = await Order.find(filter).sort(sortObj);

  res.json({
    message: "success",
    results: orders.length,
    payload: orders,
  });
});

/**
 * GET /api/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  requireValidId(id, "order id");

  const order = await Order.findById(id);

  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ message: "success", payload: order });
});

/**
 * PATCH /api/orders/:id/status
 * body: { status }
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  requireValidId(id, "order id");

  const allowed = new Set(["pending", "shipped", "delivered", "cancelled"]);
  if (!allowed.has(status)) {
    const err = new Error("Invalid status");
    err.statusCode = 400;
    throw err;
  }

  const updated = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ message: "updated", payload: updated });
});

module.exports = {
  placeOrderFromCart,
  getOrders,
  getOrderById,
  updateOrderStatus,
};

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const productsRoutes = require("./products.routes");
const customersRoutes = require("./customers.routes");
const cartsRoutes = require("./carts.routes");
const ordersRoutes = require("./orders.routes");
const authRoutes = require("./auth.routes");

/*
  Health check for API + MongoDB
  GET /api/health
*/
router.get("/health", (req, res) => {
  const state = mongoose.connection.readyState;

  const statusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.json({
    api: "ok",
    database: {
      readyState: state,
      status: statusMap[state] || "unknown",
    },
  });
});

/*
  Core resource routes
*/
router.use("/products", productsRoutes);
router.use("/customers", customersRoutes);
router.use("/carts", cartsRoutes);
router.use("/orders", ordersRoutes);
router.use("/auth", authRoutes);

/*
  Route-level 404 (API only)
*/
router.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

module.exports = router;

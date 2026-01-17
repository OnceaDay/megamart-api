const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

/*
  Health check for API + MongoDB
  GET /api/health
*/
router.get("/health", (req, res) => {
  const state = mongoose.connection.readyState;

  res.json({
    api: "ok",
    database: {
      readyState: state,
      status:
        state === 1
          ? "connected"
          : state === 2
          ? "connecting"
          : state === 0
          ? "disconnected"
          : "disconnecting",
    },
  });
});

/*
  Core resource routes
*/
router.use("/products", require("./products.routes"));
router.use("/customers", require("./customers.routes"));
router.use("/carts", require("./carts.routes"));
router.use("/orders", require("./orders.routes"));

/*
  Route-level 404 (API only)
*/
router.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
  });
});

module.exports = router;

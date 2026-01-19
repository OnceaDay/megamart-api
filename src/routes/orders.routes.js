const router = require("express").Router();

const {
  placeOrderFromCart,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orders.controller");

router.post("/from-cart/:customerId", placeOrderFromCart);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;

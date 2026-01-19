const router = require("express").Router();

const {
  getCartByCustomer,
  addItemToCart,
  updateCartItemQty,
  removeItemFromCart,
  clearCart,
} = require("../controllers/carts.controller");

router.get("/:customerId", getCartByCustomer);
router.post("/:customerId/items", addItemToCart);
router.patch("/:customerId/items/:productId", updateCartItemQty);
router.delete("/:customerId/items/:productId", removeItemFromCart);
router.delete("/:customerId/clear", clearCart);

module.exports = router;

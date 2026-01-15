const router = require("express").Router();

router.use("/products", require("./products.routes"));
router.use("/customers", require("./customers.routes"));
router.use("/carts", require("./carts.routes"));
router.use("/orders", require("./orders.routes"));

module.exports = router;

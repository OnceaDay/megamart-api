const express = require("express");
const router = express.Router();

const productsController = require("../controllers/products.controller");

// Guard: make it loud if any handler is missing
const requiredHandlers = [
  "getProducts",
  "getProductById",
  "getProductBySku",
  "createProduct",
  "updateProduct",
  "updateProductStock",
  "deleteProduct",
];

for (const h of requiredHandlers) {
  if (typeof productsController[h] !== "function") {
    throw new Error(
      `[products.router] Handler "${h}" is not a function. ` +
        `Check exports in products.controller.js`
    );
  }
}

const {
  getProducts,
  getProductById,
  getProductBySku,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
} = productsController;

// GET all (with filters/pagination/sort/search)
router.get("/", getProducts);

// Optional convenience route: MUST be above "/:id"
router.get("/sku/:sku", getProductBySku);

// GET one by Mongo ObjectId
router.get("/:id", getProductById);

// CREATE
router.post("/", createProduct);

// UPDATE
router.put("/:id", updateProduct);

// Update only quantityAvailable + inStock
router.patch("/:id/stock", updateProductStock);

// DELETE
router.delete("/:id", deleteProduct);

module.exports = router;

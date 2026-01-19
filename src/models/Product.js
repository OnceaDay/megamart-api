const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, lowercase: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Helpful index for filtering/sorting (optional but smart)
productSchema.index({ category: 1, price: 1, stock: 1 });

module.exports = mongoose.model("Product", productSchema);

// src/models/User.js
const mongoose = require("mongoose");

const USER_ROLES = ["admin", "customer"];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    passwordHash: { type: String, required: true },

    role: { type: String, enum: USER_ROLES, default: "customer" },

    // Link user account -> customer profile
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
  },
  { timestamps: true }
);

// userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);

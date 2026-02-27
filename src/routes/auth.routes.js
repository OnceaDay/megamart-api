// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();

const { protect, requireRole } = require("../middleware/auth");

const {
  register,
  login,
  me,
  adminCreateUser,
} = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);

// Admin user creation endpoint (optional but useful)
router.post("/admin/create", protect, requireRole("admin"), adminCreateUser);

module.exports = router;

// src/config/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
// const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

// --- Import router + middleware in a way that supports BOTH export styles ---
// If ../routes exports a router directly -> ok
// If ../routes exports { router } -> also ok
const routesModule = require("../routes");
const apiRoutes = routesModule.router || routesModule;

// If notFound.js exports function directly -> ok
// If notFound.js exports { notFound } -> also ok
const notFoundModule = require("../middleware/notFound");
const notFound = notFoundModule.notFound || notFoundModule;

// If errorHandler.js exports function directly -> ok
// If errorHandler.js exports { errorHandler } -> also ok
const errorHandlerModule = require("../middleware/errorHandler");
const errorHandler = errorHandlerModule.errorHandler || errorHandlerModule;

const app = express();

/**
 * Custom NoSQL sanitizer
 * - IMPORTANT: DO NOT reassign req.query / req.body / req.params
 * - We only MUTATE nested keys safely (remove keys starting with "$")
 */
function sanitizeNoSQL(obj) {
  if (!obj || typeof obj !== "object") return;

  // Handle arrays
  if (Array.isArray(obj)) {
    for (const item of obj) sanitizeNoSQL(item);
    return;
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];

    // Remove Mongo operator keys like $gt, $ne, etc.
    if (key.startsWith("$")) {
      delete obj[key];
      continue;
    }

    // Recurse into nested objects/arrays
    if (val && typeof val === "object") sanitizeNoSQL(val);
  }
}

function noSQLSanitizer(req, res, next) {
  try {
    sanitizeNoSQL(req.body);
    sanitizeNoSQL(req.params);
    sanitizeNoSQL(req.query);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * trust proxy:
 * Only needed if you're behind a proxy/load balancer (Render/Heroku/Nginx).
 * Safest to enable in production only.
 */
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/**
 * Security headers
 */
app.use(helmet());

/**
 * CORS
 * Keep dev-friendly origins now; tighten later when you have a deployed frontend URL.
 */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: false,
  })
);

/**
 * Body parsing (keep small to reduce abuse)
 */
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

/**
 * NoSQL injection hardening
 * MUST come AFTER body parsing.
 */
app.use(noSQLSanitizer);

/**
 * If you want to switch back later, keep this commented for now:
 */
// app.use(
//   mongoSanitize({
//     replaceWith: "_",
//     sanitizeQuery: false,
//   })
// );

/**
 * Prevent HTTP Parameter Pollution
 */
app.use(hpp());

/**
 * Rate limiting (basic)
 */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  })
);

/**
 * Mount API routes
 * IMPORTANT: apiRoutes MUST be a function/router.
 */
app.use("/api", apiRoutes);

/**
 * 404 + error handler (must be last)
 */
app.use(notFound);
app.use(errorHandler);

module.exports = app;

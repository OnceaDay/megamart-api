require("dotenv").config();

const env = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV || "development",
};

if (!env.MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment variables.");
}

module.exports = { env };

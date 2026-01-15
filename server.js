// server.js

const dbModule = require("./src/db/connectToMongoDB");
const { env } = require("./src/config/env");
const app = require("./src/app");

// Support either: module.exports = connectToMongoDB
// OR: module.exports = { connectToMongoDB }
const connectToMongoDB = dbModule.connectToMongoDB || dbModule;

(async () => {
  try {
    if (!env?.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing. Check your .env file.");
    }

    await connectToMongoDB(env.MONGODB_URI);

    const port = env.PORT || 3000;
    app.listen(port, () => {
      console.log(`MegaMart API listening on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message || err);
    process.exit(1);
  }
})();

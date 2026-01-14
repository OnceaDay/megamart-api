const { connectDB } = require("./src/db/connectDB");
const { env } = require("./src/config/env");
const app = require("./src/app");

(async () => {
  try {
    await connectDB(env.MONGODB_URI);

    app.listen(env.PORT, () => {
      console.log(`✅ MegaMart API listening on port ${env.PORT}`);
    });
  } catch (err) {
    console.error(" Failed to start server:", err);
    process.exit(1);
  }
})();

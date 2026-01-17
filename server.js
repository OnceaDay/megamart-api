const app = require("./src/config/app");
const connectToMongoDB = require("./src/db/connectToMongoDB");
const env = require("./src/config/env");

const PORT = env.PORT || 3000;

(async () => {
  try {
    await connectToMongoDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();

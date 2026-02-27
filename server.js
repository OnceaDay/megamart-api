const app = require("./src/config/app");
const connectToMongoDB = require("./src/db/connectToMongoDB");
const env = require("./src/config/env");

const apiRouter = require("./src/routes"); // <-- pulls src/routes/index.js

const PORT = env.PORT || 3000;

app.use("/api", apiRouter);

(async () => {
  try {
    await connectToMongoDB();
    app.listen(PORT, () => {
      // console.log(`Server DB is running and listening on port ${PORT}`);
      console.log(`Server is running on port ${PORT}`);
      console.log(`API server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();

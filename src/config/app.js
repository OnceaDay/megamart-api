const express = require("express");
const morgan = require("morgan");

const routes = require("../routes");
const { notFound } = require("../middleware/notFound");
const { errorHandler } = require("../middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

function notFound(req, res, next) {
  res.status(404).json({
    message: "Not found",
    error: `Route ${req.method} ${req.originalUrl} does not exist`,
  });
}

module.exports = { notFound };

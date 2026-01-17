const errorHandler = (err, req, res, next) => {
  // Default values
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  // Log full error in development (you want this)
  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", {
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
};

module.exports = { errorHandler };

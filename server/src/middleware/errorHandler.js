export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;

  res.status(status).json({
    message: err.message || "Server error",
    details: err.details || undefined,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}
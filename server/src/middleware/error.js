export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  const isMongooseValidation =
    err.name === 'ValidationError' || err.name === 'CastError' || err.name === 'StrictModeError';
  const status = err.status || (isMongooseValidation ? 400 : 500);
  if (status >= 500 && !err.logged) {
    console.error(err);
    err.logged = true;
  }
  res.status(status).json({ error: err.message || 'Internal server error' });
}

export const requireRole = (...allowed) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      error: `Forbidden: requires one of [${allowed.join(', ')}]`,
    });
  }
  return next();
};

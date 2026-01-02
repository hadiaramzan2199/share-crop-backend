module.exports = function requireRole(requiredRole) {
  return function (req, res, next) {
    const authDisabled =
      process.env.AUTH_DISABLED === 'true' ||
      process.env.DISABLE_AUTH === 'true' ||
      process.env.APP_AUTH_DISABLED === 'true';

    if (authDisabled) {
      return next();
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const role = typeof user.user_type === 'string' ? user.user_type.toUpperCase() : null;
    if (!role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (role !== String(requiredRole).toUpperCase()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

module.exports = function authenticate(req, res, next) {
  const authDisabled =
    process.env.AUTH_DISABLED === 'true' ||
    process.env.DISABLE_AUTH === 'true' ||
    process.env.APP_AUTH_DISABLED === 'true';

  if (authDisabled) {
    if (!req.user) {
      req.user = {
        id: 'mvp-admin',
        email: 'admin@example.com',
        user_type: 'ADMIN',
        is_active: true,
      };
    }
    return next();
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

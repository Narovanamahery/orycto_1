import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  // 1. Check session first
  if (req.session?.userId) {
    req.user = { id: req.session.userId, email: req.session.userEmail };
    return next();
  }

  // 2. Check Bearer JWT
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  return res.status(401).json({ error: 'Authentication required' });
}

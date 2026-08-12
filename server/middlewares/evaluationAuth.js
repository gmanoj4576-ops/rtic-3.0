const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  // Token might be prepended with Bearer
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_rtic_2026');
    
    // Check if it's a valid evaluator token
    if (!decoded.evaluator) {
      return res.status(403).json({ message: 'Not authorized as an evaluator, access forbidden' });
    }

    req.evaluator = decoded.evaluator;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or has expired' });
  }
};

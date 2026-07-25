const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'bookstore_jwt_secret_doi_trong_production');
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ' });
  }
}

function authOptional(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(
        tokenFromHeader(header),
        process.env.JWT_SECRET || 'bookstore_jwt_secret_doi_trong_production'
      );
      req.userId = payload.userId;
    } catch {
      /* ignore */
    }
  }
  next();
}

function tokenFromHeader(header) {
  return header.slice(7);
}

module.exports = { authRequired, authOptional };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'bookstore_jwt_secret_doi_trong_production';

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ' });
  }
}

async function adminRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ tài khoản admin mới được truy cập' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ' });
  }
}

function authOptional(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(tokenFromHeader(header), JWT_SECRET);
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

module.exports = { authRequired, authOptional, adminRequired };

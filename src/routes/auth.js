const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { userToClient } = require('../models/User');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'bookstore_jwt_secret_doi_trong_production',
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    let { username, email, firstName, lastName, password } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng nhập email' });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ và tên' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    if (!username) {
      username = email;
    }
    const normalizedUsername = String(username).trim().toLowerCase();
    const normalizedEmail = String(email).trim().toLowerCase();

    const exists = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
    });
    if (exists) {
      if (exists.email === normalizedEmail) {
        return res.status(400).json({ error: 'Email đã tồn tại' });
      }
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      password,
    });

    const token = signToken(user._id.toString());
    return res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: userToClient(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    // chấp nhận cả username hoặc email
    const login = username || email;

    if (!login || !password) {
      return res.status(400).json({
        error: 'Vui lòng nhập tên đăng nhập/email và mật khẩu'
      });
    }

    const normalized = String(login).trim().toLowerCase();

    const user = await User.findOne({
      $or: [
        { username: normalized },
        { email: normalized }
      ]
    });

    if (!user) {
      return res.status(401).json({
        error: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    const ok = await user.comparePassword(password);

    if (!ok) {
      return res.status(401).json({
        error: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    const token = signToken(user._id.toString());

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: userToClient(user)
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Lỗi server'
    });
  }
});

router.post('/logout', authRequired, (req, res) => {
  res.json({ message: 'Đã đăng xuất' });
});

router.get('/profile', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    return res.json({ user: userToClient(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.put('/profile', authRequired, async (req, res) => {
  try {
    const { username } = req.body || {};
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    if (username && String(username).trim()) {
      const normalized = String(username).trim().toLowerCase();
      if (normalized !== user.username) {
        const taken = await User.findOne({ username: normalized });
        if (taken) {
          return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        }
        user.username = normalized;
        await user.save();
      }
    }
    return res.json({
      message: 'Cập nhật thông tin thành công',
      user: userToClient(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

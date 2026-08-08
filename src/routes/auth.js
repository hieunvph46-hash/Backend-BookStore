const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa vĩnh viễn' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Tài khoản đang bị tạm khóa' });
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

// In-memory token store for forgot password (simple, not production-ready)
const resetTokens = new Map();

router.post('/change-password', authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    const ok = await user.comparePassword(currentPassword);
    if (!ok) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }
    user.password = newPassword;
    await user.save();
    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng nhập email' });
    }
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(200).json({ message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, { userId: user._id.toString(), expires: Date.now() + 3600000 });
    return res.json({
      message: 'Mã đặt lại mật khẩu đã được tạo',
      resetToken: token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Thiếu thông tin' });
    }
    const data = resetTokens.get(token);
    if (!data || data.expires < Date.now()) {
      return res.status(400).json({ error: 'Mã đặt lại không hợp lệ hoặc đã hết hạn' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    const user = await User.findById(data.userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    user.password = newPassword;
    await user.save();
    resetTokens.delete(token);
    return res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

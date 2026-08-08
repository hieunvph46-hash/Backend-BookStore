const express = require('express');
const User = require('../../models/User');
const { userToClient } = require('../../models/User');
const { adminRequired } = require('../../middleware/auth');

const router = express.Router();

router.use(adminRequired);

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.search) {
      const q = String(req.query.search).trim();
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
      ];
    }
    if (req.query.role && ['user', 'staff', 'admin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    if (req.query.status && ['active', 'banned', 'suspended'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const list = users.map(userToClient);
    return res.json({ users: list, data: list, total, page, limit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    const payload = userToClient(user);
    return res.json({ user: payload, data: payload });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id không hợp lệ' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Không thể xóa tài khoản admin' });
    }
    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Đã xóa tài khoản' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id không hợp lệ' });
  }
});

router.patch('/:id/role', async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!role || !['user', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role không hợp lệ' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    if (user._id.toString() === req.userId) {
      return res.status(400).json({ error: 'Không thể thay đổi vai trò của chính mình' });
    }
    user.role = role;
    await user.save();
    return res.json({ message: 'Đã cập nhật vai trò', user: userToClient(user) });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id không hợp lệ' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status || !['active', 'banned', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    if (user._id.toString() === req.userId) {
      return res.status(400).json({ error: 'Không thể thay đổi trạng thái của chính mình' });
    }
    user.status = status;
    await user.save();
    return res.json({ message: 'Đã cập nhật trạng thái', user: userToClient(user) });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id không hợp lệ' });
  }
});

module.exports = router;

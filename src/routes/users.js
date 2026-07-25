const express = require('express');
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const { userToClient } = require('../models/User');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar_${req.userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ chấp nhận file ảnh'));
    }
    cb(null, true);
  },
});

router.post('/avatar', authRequired, upload.single('myImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn ảnh (field: myImage)' });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    const avatarPath = `/uploads/${req.file.filename}`;
    user.avatar = avatarPath;
    await user.save();
    return res.json({
      message: 'Đổi ảnh đại diện thành công',
      user: userToClient(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Lỗi upload ảnh' });
  }
});

module.exports = router;

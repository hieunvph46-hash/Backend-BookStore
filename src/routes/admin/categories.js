const express = require('express');
const Category = require('../../models/Category');
const Book = require('../../models/Book');
const { categoryToClient } = require('../../models/Category');
const { adminRequired } = require('../../middleware/auth');

const router = express.Router();

router.use(adminRequired);

router.get('/', async (_req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    const list = [];
    for (const c of categories) {
      const count = await Book.countDocuments({ category: c._id });
      list.push({ ...categoryToClient(c), bookCount: count });
    }
    return res.json({ categories: list, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = req.body.name != null ? String(req.body.name).trim() : '';
    if (!name) {
      return res.status(400).json({ error: 'Vui lòng nhập tên danh mục' });
    }
    const exists = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (exists) {
      return res.status(400).json({ error: 'Danh mục đã tồn tại' });
    }
    const category = await Category.create({ name });
    const payload = categoryToClient(category);
    return res.status(201).json({ message: 'Đã thêm danh mục', category: payload, data: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    }
    const name = req.body.name != null ? String(req.body.name).trim() : '';
    if (!name) {
      return res.status(400).json({ error: 'Vui lòng nhập tên danh mục' });
    }
    const dup = await Category.findOne({ _id: { $ne: category._id }, name: { $regex: `^${name}$`, $options: 'i' } });
    if (dup) {
      return res.status(400).json({ error: 'Danh mục đã tồn tại' });
    }
    category.name = name;
    await category.save();
    const payload = categoryToClient(category);
    return res.json({ message: 'Đã cập nhật danh mục', category: payload, data: payload });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id danh mục không hợp lệ' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    }
    const books = await Book.countDocuments({ category: category._id });
    if (books > 0) {
      return res.status(400).json({ error: `Không thể xóa danh mục đang có ${books} sách` });
    }
    await Category.findByIdAndDelete(category._id);
    return res.json({ message: 'Đã xóa danh mục' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id danh mục không hợp lệ' });
  }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { bookToClient } = require('../models/Book');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.category) {
      const catId = req.query.category;
      if (mongoose.Types.ObjectId.isValid(catId)) {
        filter.category = catId;
      }
    }
    if (req.query.search) {
      const q = String(req.query.search).trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
      ];
    }

    const books = await Book.find(filter)
      .populate('category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const list = books.map((b) => bookToClient(b, b.category));
    return res.json({ books: list, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('category');
    if (!book) {
      return res.status(404).json({ error: 'Không tìm thấy sách' });
    }
    return res.json({ book: bookToClient(book, book.category), data: bookToClient(book, book.category) });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id sách không hợp lệ' });
  }
});

module.exports = router;

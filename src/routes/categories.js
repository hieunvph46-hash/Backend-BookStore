const express = require('express');
const Category = require('../models/Category');
const { categoryToClient } = require('../models/Category');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const list = categories.map(categoryToClient);
    return res.json({ categories: list, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

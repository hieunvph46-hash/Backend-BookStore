const express = require('express');
const router = express.Router();
const favoriteService = require('../services/favoriteService');

// POST: Thêm hoặc gỡ yêu thích
router.post('/toggle', async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if (!userId || !bookId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId hoặc bookId' });
    }

    const result = await favoriteService.toggleFavorite(userId, bookId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Lấy danh sách sản phẩm yêu thích của 1 user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const products = await favoriteService.getFavorites(userId);
    return res.status(200).json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
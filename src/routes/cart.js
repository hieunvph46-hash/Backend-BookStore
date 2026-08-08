const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { authRequired } = require('../middleware/auth');
const { cartPayloadForUser, getOrCreateCart, populateCart, buildCartResponse } = require('../services/cartService');

const router = express.Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  try {
    const cart = await cartPayloadForUser(req.userId);
    return res.json({ cart, data: cart });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { bookId, quantity = 1 } = req.body || {};
    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ error: 'bookId không hợp lệ' });
    }
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Không tìm thấy sách' });
    }
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const cart = await getOrCreateCart(req.userId);
    const existing = cart.items.find((i) => i.book.toString() === bookId);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({ book: bookId, quantity: qty });
    }
    await cart.save();
    const populated = await populateCart(cart);
    const payload = buildCartResponse(populated);
    return res.json({ message: 'Đã thêm vào giỏ hàng', cart: payload, data: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { bookId, quantity } = req.body || {};
    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ error: 'bookId không hợp lệ' });
    }
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({ error: 'Số lượng không hợp lệ' });
    }
    const cart = await getOrCreateCart(req.userId);
    const line = cart.items.find((i) => i.book.toString() === bookId);
    if (!line) {
      return res.status(404).json({ error: 'Sản phẩm không có trong giỏ' });
    }
    line.quantity = qty;
    await cart.save();
    const populated = await populateCart(cart);
    const payload = buildCartResponse(populated);
    return res.json({ cart: payload, data: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.delete('/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const cart = await getOrCreateCart(req.userId);
    cart.items = cart.items.filter((i) => i.book.toString() !== bookId);
    await cart.save();
    const populated = await populateCart(cart);
    const payload = buildCartResponse(populated);
    return res.json({ cart: payload, data: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

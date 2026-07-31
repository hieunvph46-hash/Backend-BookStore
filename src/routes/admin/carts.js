const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../../models/Cart');
const Book = require('../../models/Book');
const Order = require('../../models/Order');
const { adminRequired } = require('../../middleware/auth');
const { populateCart, buildCartResponse, getOrCreateCart } = require('../../services/cartService');

const router = express.Router();

router.use(adminRequired);

router.get('/', async (_req, res) => {
  try {
    const carts = await Cart.find()
      .sort({ updatedAt: -1 })
      .populate('user', 'username email firstName lastName');

    const list = [];
    for (const cart of carts) {
      const populated = await populateCart(cart);
      const payload = buildCartResponse(populated);
      const userDoc = cart.user;
      list.push({
        id: cart._id.toString(),
        user: userDoc
          ? {
              id: userDoc._id.toString(),
              username: userDoc.username,
              email: userDoc.email,
              firstName: userDoc.firstName,
              lastName: userDoc.lastName,
            }
          : null,
        itemCount: payload.items.length,
        totalAmount: payload.totalAmount,
        items: payload.items,
        updatedAt: cart.updatedAt?.toISOString?.() || cart.updatedAt,
      });
    }

    return res.json({ carts: list, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.put('/:userId/items/:bookId', async (req, res) => {
  try {
    const { userId, bookId } = req.params;
    const { quantity } = req.body || {};
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({ error: 'Số lượng không hợp lệ' });
    }
    const cart = await getOrCreateCart(userId);
    const line = cart.items.find((i) => i.book.toString() === bookId);
    if (!line) {
      return res.status(404).json({ error: 'Sản phẩm không có trong giỏ' });
    }
    line.quantity = qty;
    await cart.save();
    const populated = await populateCart(cart);
    const payload = buildCartResponse(populated);
    const totalAmount = payload.totalAmount;
    return res.json({ message: 'Đã cập nhật số lượng', cart: { items: payload.items, totalAmount } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.delete('/:userId/items/:bookId', async (req, res) => {
  try {
    const { userId, bookId } = req.params;
    const cart = await getOrCreateCart(userId);
    cart.items = cart.items.filter((i) => i.book.toString() !== bookId);
    await cart.save();
    const populated = await populateCart(cart);
    const payload = buildCartResponse(populated);
    return res.json({ message: 'Đã xóa sản phẩm khỏi giỏ', cart: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/:userId/checkout', async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }
    const user = await mongoose.model('User').findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    const populated = await populateCart(cart);
    const cartData = buildCartResponse(populated);
    if (!cartData.items.length) {
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }

    const orderItems = [];
    for (const line of cartData.items) {
      const book = await Book.findById(line.book.id);
      if (!book) continue;
      orderItems.push({
        book: book._id,
        quantity: line.quantity,
        price: line.price,
        subtotal: line.subtotal,
      });
    }

    const fullName = `${user.lastName} ${user.firstName}`.trim();
    const SHIPPING_FEE = 30000;
    const totalAmount = cartData.totalAmount + SHIPPING_FEE;

    const order = await Order.create({
      user: userId,
      fullName,
      phone: user.email || '',
      address: 'Admin checkout',
      paymentMethod: 'cash_on_delivery',
      shippingFee: SHIPPING_FEE,
      totalAmount,
      items: orderItems,
      status: 'confirmed',
    });

    cart.items = [];
    await cart.save();

    const full = await Order.findById(order._id).populate({
      path: 'items.book',
      populate: { path: 'category' },
    });
    return res.json({ message: 'Đã thanh toán giỏ hàng', order: full });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

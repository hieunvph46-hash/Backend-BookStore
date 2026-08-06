const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { orderToClient } = require('../models/Order');
const Book = require('../models/Book');
const Discount = require('../models/Discount');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
const SHIPPING_FEE = 30000;

router.use(authRequired);

router.post('/', async (req, res) => {
  try {
    const { fullName, address, city, postalCode, phone, paymentMethod, notes, items, discountCode } = req.body || {};
    if (!fullName || !address || !phone) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ tên, địa chỉ và số điện thoại' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Đơn hàng không có sản phẩm' });
    }

    const orderItems = [];
    let subtotal = 0;
    for (const item of items) {
      const bookId = item.bookId || item.book;
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) continue;
      const book = await Book.findById(bookId);
      if (!book) continue;
      const lineSubtotal = book.price * quantity;
      subtotal += lineSubtotal;
      orderItems.push({
        book: book._id,
        quantity,
        price: book.price,
        subtotal: lineSubtotal,
      });
    }
    if (!orderItems.length) {
      return res.status(400).json({ error: 'Đơn hàng không có sản phẩm hợp lệ' });
    }

    const now = Date.now();
    let discountAmount = 0;
    let appliedCode = '';
    if (discountCode && String(discountCode).trim()) {
      const code = String(discountCode).trim().toUpperCase();
      const discount = await Discount.findOne({ code });
      if (!discount || !discount.active) {
        return res.status(400).json({ error: 'Mã giảm giá không hợp lệ' });
      }
      if (discount.startDate && now < new Date(discount.startDate).getTime()) {
        return res.status(400).json({ error: 'Mã giảm giá chưa đến hạn sử dụng' });
      }
      if (discount.endDate && now > new Date(discount.endDate).getTime()) {
        return res.status(400).json({ error: 'Mã giảm giá đã hết hạn' });
      }
      if (discount.usageLimit > 0 && discount.usedCount >= discount.usageLimit) {
        return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng' });
      }
      if (subtotal < discount.minOrder) {
        return res.status(400).json({ error: `Đơn hàng tối thiểu ${discount.minOrder.toLocaleString('vi-VN')}đ để dùng mã này` });
      }
      if (discount.type === 'percent') {
        discountAmount = Math.round((subtotal * discount.value) / 100);
        if (discount.maxDiscount > 0 && discountAmount > discount.maxDiscount) {
          discountAmount = discount.maxDiscount;
        }
      } else {
        discountAmount = Math.min(discount.value, subtotal);
      }
      discount.usedCount += 1;
      await discount.save();
      appliedCode = discount.code;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + SHIPPING_FEE);

    const order = await Order.create({
      user: req.userId,
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      city: city ? String(city).trim() : '',
      postalCode: postalCode ? String(postalCode).trim() : '',
      notes: notes ? String(notes).trim() : '',
      paymentMethod: paymentMethod || 'cash_on_delivery',
      shippingFee: SHIPPING_FEE,
      discountCode: appliedCode,
      discountAmount,
      totalAmount,
      items: orderItems,
      status: 'pending',
    });

    const full = await Order.findById(order._id).populate({
      path: 'items.book',
      populate: { path: 'category' },
    });
    const clientOrder = orderToClient(full);
    return res.status(201).json({
      message: 'Đặt hàng thành công',
      order: clientOrder,
      data: clientOrder,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate({ path: 'items.book', populate: { path: 'category' } });
    const list = orders.map(orderToClient);
    const ordersPayload = { orders: list, data: list };
    return res.json({ orders: ordersPayload, data: ordersPayload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId }).populate({
      path: 'items.book',
      populate: { path: 'category' },
    });
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }
    const clientOrder = orderToClient(order);
    return res.json({ order: clientOrder, data: clientOrder });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id đơn hàng không hợp lệ' });
  }
});

module.exports = router;

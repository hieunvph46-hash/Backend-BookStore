const express = require('express');
const Order = require('../../models/Order');
const { orderToClient } = require('../../models/Order');
const { adminRequired } = require('../../middleware/auth');

const router = express.Router();

const STATUSES = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

router.use(adminRequired);

function orderToAdminClient(doc) {
  const base = orderToClient(doc);
  let user = null;
  if (doc.user && typeof doc.user === 'object' && doc.user.username) {
    user = {
      id: doc.user._id.toString(),
      username: doc.user.username,
      email: doc.user.email,
      firstName: doc.user.firstName,
      lastName: doc.user.lastName,
    };
  }
  return { ...base, user };
}

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status && STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email firstName lastName')
        .populate({ path: 'items.book', populate: { path: 'category' } }),
      Order.countDocuments(filter),
    ]);

    const list = orders.map(orderToAdminClient);
    return res.json({ orders: list, data: list, total, page, limit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email firstName lastName')
      .populate({ path: 'items.book', populate: { path: 'category' } });
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }
    const payload = orderToAdminClient(order);
    return res.json({ order: payload, data: payload });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id đơn hàng không hợp lệ' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status || !STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('user', 'username email firstName lastName')
      .populate({ path: 'items.book', populate: { path: 'category' } });
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }
    const payload = orderToAdminClient(order);
    return res.json({ message: 'Đã cập nhật trạng thái', order: payload, data: payload });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id đơn hàng không hợp lệ' });
  }
});

module.exports = router;

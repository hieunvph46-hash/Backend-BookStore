const express = require('express');
const Order = require('../../models/Order');
const User = require('../../models/User');
const Book = require('../../models/Book');
const { adminRequired } = require('../../middleware/auth');

const router = express.Router();

router.use(adminRequired);

router.get('/overview', async (_req, res) => {
  try {
    const [totalOrders, totalUsers, totalBooks, revenueResult] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Book.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return res.json({
      data: { totalOrders, totalUsers, totalBooks, totalRevenue },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/revenue', async (req, res) => {
  try {
    const groupBy = req.query.groupBy || 'day';
    const match = { status: { $ne: 'cancelled' } };

    if (req.query.from || req.query.to) {
      match.createdAt = {};
      if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        match.createdAt.$lte = to;
      }
    }

    let groupId;
    if (groupBy === 'month') {
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
    } else if (groupBy === 'year') {
      groupId = { year: { $year: '$createdAt' } };
    } else {
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
    }

    const rows = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupId,
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const data = rows.map((r) => {
      let label;
      if (groupBy === 'month') {
        label = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
      } else if (groupBy === 'year') {
        label = String(r._id.year);
      } else {
        label = `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2, '0')}`;
      }
      return { label, revenue: r.revenue, orderCount: r.orderCount };
    });

    return res.json({ data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/top-books', async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const rows = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.book',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]);

    const bookIds = rows.map((r) => r._id);
    const books = await Book.find({ _id: { $in: bookIds } }).populate('category');
    const bookMap = {};
    for (const b of books) {
      bookMap[b._id.toString()] = b;
    }

    const data = rows.map((r) => {
      const book = bookMap[r._id.toString()];
      return {
        book: book
          ? { id: book._id.toString(), title: book.title, author: book.author, coverImage: book.coverImage, category: book.category?.name }
          : null,
        totalQuantity: r.totalQuantity,
        totalRevenue: r.totalRevenue,
      };
    });

    return res.json({ data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

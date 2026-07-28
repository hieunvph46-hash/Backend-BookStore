const express = require('express');
const Cart = require('../../models/Cart');
const { adminRequired } = require('../../middleware/auth');
const { populateCart, buildCartResponse } = require('../../services/cartService');

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

module.exports = router;

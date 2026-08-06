const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { bookToClient } = require('../models/Book');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

async function populateCart(cart) {
  return Cart.findById(cart._id).populate({
    path: 'items.book',
    populate: { path: 'category' },
  });
}

function buildCartResponse(cartDoc) {
  const items = [];
  let totalAmount = 0;
  for (const line of cartDoc.items || []) {
    if (!line.book) continue;
    const price = line.book.price;
    const subtotal = price * line.quantity;
    totalAmount += subtotal;
    items.push({
      _id: line._id.toString(),
      id: line._id.toString(),
      book: bookToClient(line.book, line.book.category),
      quantity: line.quantity,
      price,
      subtotal,
    });
  }
  return { items, totalAmount };
}

async function cartPayloadForUser(userId) {
  const cart = await getOrCreateCart(userId);
  const populated = await populateCart(cart);
  return buildCartResponse(populated);
}

module.exports = {
  getOrCreateCart,
  populateCart,
  buildCartResponse,
  cartPayloadForUser,
};

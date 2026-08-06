const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    notes: { type: String, default: '' },
    paymentMethod: { type: String, default: 'cash_on_delivery' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingFee: { type: Number, default: 30000 },
    discountCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

function orderToClient(doc) {
  const { bookToClient } = require('./Book');
  const id = doc._id.toString();
  const items = (doc.items || []).map((line) => {
    const book = line.book && line.book.title ? bookToClient(line.book) : null;
    return {
      book,
      quantity: line.quantity,
      price: line.price,
      subtotal: line.subtotal,
    };
  });
  return {
    _id: id,
    id,
    status: doc.status,
    fullName: doc.fullName,
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    paymentMethod: doc.paymentMethod,
    shippingAddress: doc.address,
    address: doc.address,
    phone: doc.phone,
    shippingFee: doc.shippingFee,
    discountCode: doc.discountCode,
    discountAmount: doc.discountAmount,
    totalAmount: doc.totalAmount,
    items,
  };
}

orderSchema.statics.toClient = orderToClient;

module.exports = mongoose.model('Order', orderSchema);
module.exports.orderToClient = orderToClient;

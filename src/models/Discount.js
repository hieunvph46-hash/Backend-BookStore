const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

function discountToClient(doc) {
  const id = doc._id.toString();
  return {
    _id: id,
    id,
    code: doc.code,
    description: doc.description,
    type: doc.type,
    value: doc.value,
    minOrder: doc.minOrder,
    maxDiscount: doc.maxDiscount,
    usageLimit: doc.usageLimit,
    usedCount: doc.usedCount,
    startDate: doc.startDate ? doc.startDate.toISOString() : null,
    endDate: doc.endDate ? doc.endDate.toISOString() : null,
    active: doc.active,
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
  };
}

discountSchema.statics.toClient = discountToClient;

module.exports = mongoose.model('Discount', discountSchema);
module.exports.discountToClient = discountToClient;

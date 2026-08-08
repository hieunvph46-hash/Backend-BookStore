const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // Mỗi user chỉ có 1 danh sách favorite
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book' // Tên Model Sản phẩm của bạn
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Favorite', FavoriteSchema);
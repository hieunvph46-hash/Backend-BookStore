const Favorite = require('../models/Favorite');

// 1. Thêm / Xóa khỏi danh sách yêu thích (Toggle)
const toggleFavorite = async (userId, bookId) => {
  let favorite = await Favorite.findOne({ user: userId });

  if (!favorite) {
    favorite = new Favorite({
      user: userId,
      products: [bookId]
    });
    await favorite.save();
    return { isFavorite: true, message: 'Đã thêm vào danh sách yêu thích' };
  }

  const isExist = favorite.products.includes(bookId);

  if (isExist) {
    // Nếu đã có -> Xóa khỏi mảng products
    await Favorite.findOneAndUpdate(
      { user: userId },
      { $pull: { products: bookId } }
    );
    return { isFavorite: false, message: 'Đã xóa khỏi danh sách yêu thích' };
  } else {
    // Nếu chưa có -> Thêm vào mảng products
    await Favorite.findOneAndUpdate(
      { user: userId },
      { $addToSet: { products: bookId } }
    );
    return { isFavorite: true, message: 'Đã thêm vào danh sách yêu thích' };
  }
};

// 2. Lấy danh sách yêu thích của người dùng
const getFavorites = async (userId) => {
  const favorite = await Favorite.findOne({ user: userId }).populate('products');
  return favorite ? favorite.products : [];
};

module.exports = {
  toggleFavorite,
  getFavorites
};
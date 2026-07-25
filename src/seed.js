require('dotenv').config();
const { connectDB } = require('./config/db');
const Category = require('./models/Category');
const Book = require('./models/Book');
const User = require('./models/User');

const categories = [
  { name: 'Văn học' },
  { name: 'Kinh tế' },
  { name: 'Kỹ năng sống' },
  { name: 'Thiếu nhi' },
];

const booksSeed = [
  {
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    description: 'Hành trình tìm kho báu và ý nghĩa cuộc đời của cậu bé chăn cừu Santiago.',
    coverImage: 'https://picsum.photos/seed/nhagiakim/400/600',
    price: 89000,
    categoryIndex: 0,
  },
  {
    title: 'Sapiens: Lược Sử Loài Người',
    author: 'Yuval Noah Harari',
    description: 'Khám phá lịch sử tiến hóa và văn minh loài người.',
    coverImage: 'https://picsum.photos/seed/sapiens/400/600',
    price: 199000,
    categoryIndex: 1,
  },
  {
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    description: 'Nghệ thuật thu phục lòng người và giao tiếp hiệu quả.',
    coverImage: 'https://picsum.photos/seed/dacnhantam/400/600',
    price: 76000,
    categoryIndex: 2,
  },
  {
    title: 'Doraemon - Tập 1',
    author: 'Fujiko F. Fujio',
    description: 'Cuộc phiêu lưu của chú mèo máy đến từ tương lai.',
    coverImage: 'https://picsum.photos/seed/doraemon/400/600',
    price: 25000,
    categoryIndex: 3,
  },
  {
    title: 'Truyện Kiều',
    author: 'Nguyễn Du',
    description: 'Kiệt tác văn học Việt Nam.',
    coverImage: 'https://picsum.photos/seed/truyenkieu/400/600',
    price: 45000,
    categoryIndex: 0,
  },
];

async function seed() {
  await connectDB();

  const catCount = await Category.countDocuments();
  let cats = await Category.find();
  if (catCount === 0) {
    cats = await Category.insertMany(categories);
    console.log('Seeded categories:', cats.length);
  }

  const bookCount = await Book.countDocuments();
  if (bookCount === 0) {
    for (const item of booksSeed) {
      const { categoryIndex, ...rest } = item;
      await Book.create({
        ...rest,
        category: cats[categoryIndex]._id,
      });
    }
    console.log('Seeded books:', booksSeed.length);
  }

  const admin = await User.findOne({ username: 'admin@bookstore.vn' });
  if (!admin) {
    await User.create({
      username: 'admin@bookstore.vn',
      email: 'admin@bookstore.vn',
      firstName: 'Admin',
      lastName: 'BookStore',
      password: '123456',
      role: 'admin',
    });
    console.log('Admin: admin@bookstore.vn / 123456');
  }

  console.log('Seed done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

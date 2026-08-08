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
    stock: 4,
    categoryIndex: 0,
  },
  {
    title: 'Sapiens: Lược Sử Loài Người',
    author: 'Yuval Noah Harari',
    description: 'Khám phá lịch sử tiến hóa và văn minh loài người.',
    coverImage: 'https://picsum.photos/seed/sapiens/400/600',
    price: 199000,
    stock: 12,
    categoryIndex: 1,
  },
  {
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    description: 'Nghệ thuật thu phục lòng người và giao tiếp hiệu quả.',
    coverImage: 'https://picsum.photos/seed/dacnhantam/400/600',
    price: 76000,
    stock: 8,
    categoryIndex: 2,
  },
  {
    title: 'Doraemon - Tập 1',
    author: 'Fujiko F. Fujio',
    description: 'Cuộc phiêu lưu của chú mèo máy đến từ tương lai.',
    coverImage: 'https://picsum.photos/seed/doraemon/400/600',
    price: 25000,
    stock: 75,
    categoryIndex: 3,
  },
  {
    title: 'Truyện Kiều',
    author: 'Nguyễn Du',
    description: 'Kiệt tác văn học Việt Nam.',
    coverImage: 'https://picsum.photos/seed/truyenkieu/400/600',
    price: 45000,
    stock: 120,
    categoryIndex: 0,
  },
  {
    title: 'Hoàng Tử Bé',
    author: 'Antoine de Saint-Exupéry',
    description: 'Câu chuyện triết lý nhẹ nhàng về tình bạn, tình yêu và ý nghĩa cuộc sống.',
    coverImage: 'https://picsum.photos/seed/hoangtube/400/600',
    price: 55000,
    stock: 60,
    categoryIndex: 0,
  },
  {
    title: 'Ông Già Và Biển Cả',
    author: 'Ernest Hemingway',
    description: 'Tác phẩm kinh điển về nghị lực và lòng kiên trì của con người.',
    coverImage: 'https://picsum.photos/seed/onggiabien/400/600',
    price: 68000,
    stock: 8,
    categoryIndex: 0,
  },
  {
    title: 'Không Gia Đình',
    author: 'Hector Malot',
    description: 'Hành trình phiêu lưu và trưởng thành của cậu bé Rê-mi.',
    coverImage: 'https://picsum.photos/seed/khonggiadinh/400/600',
    price: 92000,
    stock: 45,
    categoryIndex: 0,
  },
  {
    title: 'Nhà Thờ Đức Bà Paris',
    author: 'Victor Hugo',
    description: 'Kiệt tác văn học Pháp với bi kịch tình yêu bất tử.',
    coverImage: 'https://picsum.photos/seed/nhathoducba/400/600',
    price: 110000,
    stock: 20,
    categoryIndex: 0,
  },
  {
    title: 'Cha Giàu Cha Nghèo',
    author: 'Robert Kiyosaki',
    description: 'Bài học tài chính cá nhân thay đổi tư duy về tiền bạc.',
    coverImage: 'https://picsum.photos/seed/chagiauchangheo/400/600',
    price: 145000,
    stock: 35,
    categoryIndex: 1,
  },
  {
    title: 'Nghĩ Giàu Làm Giàu',
    author: 'Napoleon Hill',
    description: 'Nguyên tắc thành công được đúc kết từ hàng trăm triệu phú.',
    coverImage: 'https://picsum.photos/seed/nghigiaulamgiau/400/600',
    price: 99000,
    stock: 25,
    categoryIndex: 1,
  },
  {
    title: '7 Thói Quen Hiệu Quả',
    author: 'Stephen R. Covey',
    description: 'Bí quyết xây dựng thói quen tốt để thành công bền vững.',
    coverImage: 'https://picsum.photos/seed/7thoiquen/400/600',
    price: 135000,
    stock: 18,
    categoryIndex: 2,
  },
  {
    title: 'Đọc Vị Bất Kỳ Ai',
    author: 'David J. Lieberman',
    description: 'Nghệ thuật thấu hiểu suy nghĩ và cảm xúc của người khác.',
    coverImage: 'https://picsum.photos/seed/docvibatkyai/400/600',
    price: 89000,
    stock: 40,
    categoryIndex: 2,
  },
  {
    title: 'Dế Mèn Phiêu Lưu Ký',
    author: 'Tô Hoài',
    description: 'Tác phẩm thiếu nhi kinh điển của văn học Việt Nam.',
    coverImage: 'https://picsum.photos/seed/demen/400/600',
    price: 85000,
    stock: 70,
    categoryIndex: 3,
  },
  {
    title: 'Kính Vạn Hoa',
    author: 'Nguyễn Nhật Ánh',
    description: 'Tuổi thơ đầy kỷ niệm của Quý ròm, Tiểu Long và nhóm bạn.',
    coverImage: 'https://picsum.photos/seed/kinhvanhoa/400/600',
    price: 98000,
    stock: 6,
    categoryIndex: 3,
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

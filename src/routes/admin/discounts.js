const express = require('express');
const Discount = require('../../models/Discount');
const { discountToClient } = require('../../models/Discount');
const { adminRequired } = require('../../middleware/auth');

const router = express.Router();

router.use(adminRequired);

function parseDiscountFields(body, existing) {
  const data = {};

  if (body.code !== undefined) {
    const code = String(body.code).trim().toUpperCase();
    if (!code) throw Object.assign(new Error('Vui lòng nhập mã giảm giá'), { status: 400 });
    data.code = code;
  }

  if (body.description !== undefined) {
    data.description = String(body.description).trim();
  }

  if (body.type !== undefined) {
    if (!['percent', 'fixed'].includes(body.type)) {
      throw Object.assign(new Error('Loại giảm giá không hợp lệ'), { status: 400 });
    }
    data.type = body.type;
  }

  const type = data.type || existing?.type || 'percent';

  if (body.value !== undefined) {
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) {
      throw Object.assign(new Error('Giá trị giảm phải lớn hơn 0'), { status: 400 });
    }
    if (type === 'percent' && value > 100) {
      throw Object.assign(new Error('Phần trăm giảm không được vượt quá 100%'), { status: 400 });
    }
    data.value = value;
  }

  for (const field of ['minOrder', 'maxDiscount', 'usageLimit']) {
    if (body[field] !== undefined) {
      const num = Number(body[field]);
      if (!Number.isFinite(num) || num < 0) {
        throw Object.assign(new Error(`Giá trị "${field}" phải là số không âm`), { status: 400 });
      }
      data[field] = num;
    }
  }

  if (body.startDate !== undefined && body.startDate !== '' && body.startDate !== null) {
    const d = new Date(body.startDate);
    if (Number.isNaN(d.getTime())) {
      throw Object.assign(new Error('Ngày bắt đầu không hợp lệ'), { status: 400 });
    }
    data.startDate = d;
  } else if (body.startDate !== undefined) {
    data.startDate = null;
  }

  if (body.endDate !== undefined && body.endDate !== '' && body.endDate !== null) {
    const d = new Date(body.endDate);
    if (Number.isNaN(d.getTime())) {
      throw Object.assign(new Error('Ngày kết thúc không hợp lệ'), { status: 400 });
    }
    data.endDate = d;
  } else if (body.endDate !== undefined) {
    data.endDate = null;
  }

  const start = data.startDate || existing?.startDate || null;
  const end = data.endDate || existing?.endDate || null;
  if (start && end && end < start) {
    throw Object.assign(new Error('Ngày kết thúc phải sau ngày bắt đầu'), { status: 400 });
  }

  if (body.active !== undefined) {
    data.active = !!body.active;
  }

  return data;
}

router.get('/', async (_req, res) => {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 });
    const list = discounts.map(discountToClient);
    return res.json({ discounts: list, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = parseDiscountFields(req.body);
    if (!data.code) {
      return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá' });
    }
    const exists = await Discount.findOne({ code: data.code });
    if (exists) {
      return res.status(400).json({ error: 'Mã giảm giá đã tồn tại' });
    }
    const discount = await Discount.create(data);
    const payload = discountToClient(discount);
    return res.status(201).json({ message: 'Đã tạo mã giảm giá', discount: payload, data: payload });
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return res.status(status).json({ error: status === 500 ? 'Lỗi server' : err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });
    }
    const data = parseDiscountFields(req.body, discount);
    if (data.code) {
      const dup = await Discount.findOne({ _id: { $ne: discount._id }, code: data.code });
      if (dup) {
        return res.status(400).json({ error: 'Mã giảm giá đã tồn tại' });
      }
    }
    Object.assign(discount, data);
    await discount.save();
    const payload = discountToClient(discount);
    return res.json({ message: 'Đã cập nhật mã giảm giá', discount: payload, data: payload });
  } catch (err) {
    console.error(err);
    const status = err.status || 400;
    return res.status(status).json({ error: status === 400 ? 'Id mã giảm giá không hợp lệ' : err.message });
  }
});

router.patch('/:id/toggle', async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });
    }
    discount.active = !discount.active;
    await discount.save();
    const payload = discountToClient(discount);
    return res.json({ message: discount.active ? 'Đã kích hoạt mã giảm giá' : 'Đã vô hiệu hóa mã giảm giá', discount: payload, data: payload });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id mã giảm giá không hợp lệ' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });
    }
    await Discount.findByIdAndDelete(discount._id);
    return res.json({ message: 'Đã xóa mã giảm giá' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Id mã giảm giá không hợp lệ' });
  }
});

module.exports = router;

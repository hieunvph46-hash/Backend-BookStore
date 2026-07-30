import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

const emptyForm = {
  title: '',
  author: '',
  description: '',
  price: '',
  category: '',
  coverImage: '',
};

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.get('/api/categories').then(({ data }) => {
      setCategories(data.categories || data.data || []);
    });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api
      .get(`/api/admin/books/${id}`)
      .then(({ data }) => {
        const book = data.book || data.data;
        setForm({
          title: book.title || '',
          author: book.author || '',
          description: book.description || '',
          price: String(book.price ?? ''),
          category: book.category?.id || book.category?._id || '',
          coverImage: book.coverImage || book.image || '',
        });
      })
      .catch((err) => setError(err.response?.data?.error || 'Không tải được sách'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('author', form.author);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('category', form.category);
    if (file) {
      fd.append('coverImage', file);
    } else if (form.coverImage.trim()) {
      fd.append('coverImage', form.coverImage.trim());
    }

    try {
      if (isEdit) {
        await api.put(`/api/admin/books/${id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/api/admin/books', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast(isEdit ? 'Đã cập nhật sách' : 'Đã thêm sách', 'success');
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Lưu thất bại');
    }
  };

  if (loading) return <p>Đang tải…</p>;

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>{isEdit ? 'Sửa sách' : 'Thêm sách'}</h2>
          <Link to="/products" className="muted">
            ← Quay lại danh sách
          </Link>
        </div>
      </header>

      <form className="card form-card" onSubmit={onSubmit}>
        {error ? <p className="error">{error}</p> : null}
        <label>
          Tiêu đề *
          <input name="title" value={form.title} onChange={onChange} required />
        </label>
        <label>
          Tác giả *
          <input name="author" value={form.author} onChange={onChange} required />
        </label>
        <label>
          Danh mục *
          <select name="category" value={form.category} onChange={onChange} required>
            <option value="">— Chọn —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Giá (VNĐ) *
          <input name="price" type="number" min="0" step="1000" value={form.price} onChange={onChange} required />
        </label>
        <label>
          Mô tả
          <textarea name="description" rows={4} value={form.description} onChange={onChange} />
        </label>
        <label>
          URL ảnh bìa (nếu không upload file)
          <input name="coverImage" value={form.coverImage} onChange={onChange} placeholder="https://… hoặc /uploads/…" />
        </label>
        <label>
          Upload ảnh bìa
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn primary">
            Lưu
          </button>
          <Link to="/products" className="btn secondary">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}

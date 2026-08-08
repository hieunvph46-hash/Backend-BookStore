import { useCallback, useEffect, useState } from 'react';
import { Tags, Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/toastContext';
import ConfirmDialog from '../components/ConfirmDialog';

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/admin/categories');
      setCategories(data.categories || data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Không tải được danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setName(c.name);
    setModalOpen(true);
  };

  const onSave = async () => {
    if (!name.trim()) {
      toast('Vui lòng nhập tên danh mục', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/admin/categories/${editing.id}`, { name: name.trim() });
        toast('Đã cập nhật danh mục', 'success');
      } else {
        await api.post('/api/admin/categories', { name: name.trim() });
        toast('Đã thêm danh mục', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast(err.response?.data?.error || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/categories/${deleteTarget.id}`);
      toast('Đã xóa danh mục', 'success');
      await load();
    } catch (err) {
      toast(err.response?.data?.error || 'Xóa thất bại', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalBooks = categories.reduce((sum, c) => sum + (c.bookCount || 0), 0);

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Danh mục</h2>
          <p className="muted">{categories.length} danh mục · {totalBooks} sách</p>
        </div>
        <button className="btn primary" onClick={openAdd}>
          <Plus size={17} /> Thêm danh mục
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <div className="card"><div className="skeleton" style={{ height: 220 }} /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Tên danh mục</th>
                  <th>Số sách</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="muted small">{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="ms-icon tone-blue" style={{ width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Tags size={16} />
                        </span>
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-user">{c.bookCount || 0} sách</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn icon-btn secondary" title="Sửa" onClick={() => openEdit(c)}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn icon-btn danger" title="Xóa" onClick={() => setDeleteTarget(c)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">
                        <div className="empty-icon"><Tags size={26} /></div>
                        <p>Chưa có danh mục nào</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-head">
              <h3 className="card-title">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              <button className="btn ghost" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <label>
              Tên danh mục *
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Văn học" autoFocus
                onKeyDown={(e) => e.key === 'Enter' && onSave()} />
            </label>
            <div className="form-actions">
              <button className="btn primary" onClick={onSave} disabled={saving}>
                {saving ? 'Đang lưu…' : 'Lưu'}
              </button>
              <button className="btn secondary" onClick={() => setModalOpen(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa danh mục"
        message={`Bạn có chắc muốn xóa danh mục "${deleteTarget?.name}"?`}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

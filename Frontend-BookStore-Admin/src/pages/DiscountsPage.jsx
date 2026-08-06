import { useCallback, useEffect, useState } from 'react';
import { TicketPercent, Plus, Pencil, Trash2, X, Power } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/toastContext';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm = {
  code: '',
  description: '',
  type: 'percent',
  value: '',
  minOrder: '0',
  maxDiscount: '',
  usageLimit: '',
  startDate: '',
  endDate: '',
  active: true,
};

function toDateTimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getStatus(d) {
  const now = Date.now();
  if (!d.active) return { label: 'Vô hiệu', cls: 'badge-suspended' };
  if (d.startDate && now < new Date(d.startDate).getTime()) return { label: 'Sắp tới', cls: 'badge-pending' };
  if (d.endDate && now > new Date(d.endDate).getTime()) return { label: 'Hết hạn', cls: 'badge-cancelled' };
  if (d.usageLimit > 0 && d.usedCount >= d.usageLimit) return { label: 'Hết lượt', cls: 'badge-banned' };
  return { label: 'Hoạt động', cls: 'badge-active' };
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('vi-VN');
}

export default function DiscountsPage() {
  const toast = useToast();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/admin/discounts');
      setDiscounts(data.discounts || data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Không tải được mã giảm giá');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      code: d.code,
      description: d.description || '',
      type: d.type,
      value: String(d.value),
      minOrder: String(d.minOrder || 0),
      maxDiscount: d.maxDiscount ? String(d.maxDiscount) : '',
      usageLimit: d.usageLimit ? String(d.usageLimit) : '',
      startDate: toDateTimeLocal(d.startDate),
      endDate: toDateTimeLocal(d.endDate),
      active: d.active,
    });
    setModalOpen(true);
  };

  const set = (k) => (e) => {
    const val = k === 'active' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const buildPayload = () => {
    const p = {
      code: form.code,
      description: form.description,
      type: form.type,
      value: form.value,
      minOrder: form.minOrder,
      maxDiscount: form.maxDiscount,
      usageLimit: form.usageLimit,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      active: form.active,
    };
    if (form.type === 'fixed') p.maxDiscount = 0;
    return p;
  };

  const onSave = async () => {
    if (!form.code.trim()) {
      toast('Vui lòng nhập mã giảm giá', 'error');
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      toast('Vui lòng nhập giá trị giảm', 'error');
      return;
    }
    if (form.type === 'percent' && Number(form.value) > 100) {
      toast('Phần trăm giảm không được vượt quá 100%', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/admin/discounts/${editing.id}`, buildPayload());
        toast('Đã cập nhật mã giảm giá', 'success');
      } else {
        await api.post('/api/admin/discounts', buildPayload());
        toast('Đã tạo mã giảm giá', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast(err.response?.data?.error || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onToggle = async (d) => {
    try {
      const { data } = await api.patch(`/api/admin/discounts/${d.id}/toggle`);
      toast(data.message || 'Đã cập nhật trạng thái', 'success');
      await load();
    } catch (err) {
      toast(err.response?.data?.error || 'Cập nhật trạng thái thất bại', 'error');
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/discounts/${deleteTarget.id}`);
      toast('Đã xóa mã giảm giá', 'success');
      await load();
    } catch (err) {
      toast(err.response?.data?.error || 'Xóa thất bại', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const activeCount = discounts.filter((d) => getStatus(d).label === 'Hoạt động').length;

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Mã giảm giá</h2>
          <p className="muted">{discounts.length} mã · {activeCount} đang hoạt động</p>
        </div>
        <button className="btn primary" onClick={openAdd}>
          <Plus size={17} /> Thêm mã giảm giá
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <div className="card"><div className="skeleton" style={{ height: 260 }} /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Giảm giá</th>
                  <th>Điều kiện</th>
                  <th>Lượt dùng</th>
                  <th>Hiệu lực</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => {
                  const st = getStatus(d);
                  return (
                    <tr key={d.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="ms-icon tone-violet" style={{ width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TicketPercent size={16} />
                          </span>
                          <div>
                            <strong>{d.code}</strong>
                            {d.description ? <div className="muted small">{d.description}</div> : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-confirmed">
                          {d.type === 'percent' ? `${d.value}%` : `${fmtMoney(d.value)}đ`}
                          {d.type === 'percent' && d.maxDiscount > 0 ? ` (tối đa ${fmtMoney(d.maxDiscount)}đ)` : ''}
                        </span>
                      </td>
                      <td className="muted small">
                        {d.minOrder > 0 ? `Tối thiểu ${fmtMoney(d.minOrder)}đ` : 'Không giới hạn'}
                      </td>
                      <td>
                        <span className="muted small">
                          {d.usageLimit > 0 ? `${d.usedCount}/${d.usageLimit}` : `${d.usedCount}`}
                        </span>
                      </td>
                      <td className="muted small">
                        {d.startDate || d.endDate ? (
                          <>
                            {d.startDate ? <div>{new Date(d.startDate).toLocaleDateString('vi-VN')}</div> : null}
                            {d.endDate ? <div>đến {new Date(d.endDate).toLocaleDateString('vi-VN')}</div> : null}
                          </>
                        ) : (
                          'Không giới hạn'
                        )}
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn icon-btn secondary" title={d.active ? 'Vô hiệu hóa' : 'Kích hoạt'} onClick={() => onToggle(d)}>
                            <Power size={16} />
                          </button>
                          <button className="btn icon-btn secondary" title="Sửa" onClick={() => openEdit(d)}>
                            <Pencil size={16} />
                          </button>
                          <button className="btn icon-btn danger" title="Xóa" onClick={() => setDeleteTarget(d)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {discounts.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-icon"><TicketPercent size={26} /></div>
                        <p>Chưa có mã giảm giá nào</p>
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
          <div className="card modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="card-head">
              <h3 className="card-title">{editing ? `Sửa mã ${editing.code}` : 'Thêm mã giảm giá'}</h3>
              <button className="btn ghost" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>

            <label>
              Mã giảm giá *
              <input value={form.code} onChange={set('code')} placeholder="VD: SALE20" autoFocus
                onKeyDown={(e) => e.key === 'Enter' && onSave()} />
            </label>

            <label>
              Mô tả
              <input value={form.description} onChange={set('description')} placeholder="VD: Giảm 20% toàn bộ sách văn học" />
            </label>

            <div className="form-row">
              <label>
                Loại giảm
                <select value={form.type} onChange={set('type')}>
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định</option>
                </select>
              </label>
              <label>
                Giá trị giảm *
                <input type="number" min="1" max={form.type === 'percent' ? 100 : undefined} value={form.value}
                  onChange={set('value')} placeholder={form.type === 'percent' ? 'VD: 20' : 'VD: 50000'} />
              </label>
            </div>

            {form.type === 'percent' && (
              <label>
                Giảm tối đa (đồng, để trống = không giới hạn)
                <input type="number" min="0" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="VD: 100000" />
              </label>
            )}

            <div className="form-row">
              <label>
                Đơn tối thiểu (đồng)
                <input type="number" min="0" value={form.minOrder} onChange={set('minOrder')} placeholder="VD: 200000" />
              </label>
              <label>
                Số lượt dùng (để trống = không giới hạn)
                <input type="number" min="0" value={form.usageLimit} onChange={set('usageLimit')} placeholder="VD: 100" />
              </label>
            </div>

            <div className="form-row">
              <label>
                Ngày bắt đầu
                <input type="datetime-local" value={form.startDate} onChange={set('startDate')} />
              </label>
              <label>
                Ngày kết thúc
                <input type="datetime-local" value={form.endDate} onChange={set('endDate')} />
              </label>
            </div>

            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, fontWeight: 500 }}>
              <input type="checkbox" checked={form.active} onChange={set('active')} style={{ width: 'auto', margin: 0 }} />
              Kích hoạt ngay
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
        title="Xóa mã giảm giá"
        message={`Bạn có chắc muốn xóa mã "${deleteTarget?.code}"?`}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import Pagination from '../components/Pagination';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

function statusBadge(value) {
  const map = { pending: 'badge-pending', confirmed: 'badge-confirmed', shipping: 'badge-shipping', delivered: 'badge-delivered', cancelled: 'badge-cancelled' };
  return `badge ${map[value] || 'badge-user'}`;
}

function statusLabel(value) {
  return STATUS_OPTIONS.find((s) => s.value === value)?.label || value;
}

export default function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: p, limit };
      if (filter) params.status = filter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/api/admin/orders', { params });
      setOrders(data.orders || data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, [filter]);

  const onStatusChange = async (orderId, status) => {
    try {
      const { data } = await api.patch(`/api/admin/orders/${orderId}/status`, { status });
      const updated = data.order || data.data;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      toast('Đã cập nhật trạng thái', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Cập nhật thất bại', 'error');
    }
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Đơn hàng</h2>
          <p className="muted">{from}–{to}/{total} đơn</p>
        </div>
      </header>

      <div className="toolbar card">
        <input type="search" placeholder="Tìm theo tên, SĐT, địa chỉ…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)} />
        <label className="status-row">
          Trạng thái
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Đang tải…</p> : null}

      {!loading && (
        <div className="stack">
          {orders.map((order) => (
            <article key={order.id} className="card order-card">
              <div className="order-head">
                <div>
                  <strong>#{order.id.slice(-6).toUpperCase()}</strong>
                  <span className="muted"> · {order.fullName}</span>
                  <div className="muted small">
                    {order.user?.email || order.phone} · {order.address}
                  </div>
                </div>
                <div className="order-meta">
                  <span className={statusBadge(order.status)}>{statusLabel(order.status)}</span>
                  <span className="small">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                  <strong>{(order.totalAmount || 0).toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>
              <ul className="order-items">
                {(order.items || []).map((line, idx) => (
                  <li key={idx}>
                    {line.book?.title || 'Sách'} × {line.quantity} —{' '}
                    {(line.subtotal || 0).toLocaleString('vi-VN')} đ
                  </li>
                ))}
              </ul>
              <label className="status-row">
                Cập nhật:
                <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
            </article>
          ))}
          {orders.length === 0 ? <p className="muted" style={{textAlign:'center',padding:'2rem'}}>Không có dữ liệu</p> : null}
          <Pagination page={page} limit={limit} total={total} onChange={(p) => { setPage(p); load(p); }} />
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function formatVND(n) { return (n || 0).toLocaleString('vi-VN') + ' đ'; }

function statusBadge(value) {
  const map = { pending: 'badge-pending', confirmed: 'badge-confirmed', shipping: 'badge-shipping', delivered: 'badge-delivered', cancelled: 'badge-cancelled' };
  return `badge ${map[value] || 'badge-user'}`;
}

function statusLabel(value) {
  const labels = { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy' };
  return labels[value] || value;
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [ov, orders] = await Promise.all([
          api.get('/api/admin/stats/overview'),
          api.get('/api/admin/orders', { params: { limit: 5 } }),
        ]);
        setOverview(ov.data.data);
        setRecentOrders(orders.data.orders || orders.data.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Không tải được dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Đang tải…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!overview) return null;

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Tổng quan</h2>
          <p className="muted">Bảng điều khiển quản trị BookStore</p>
        </div>
      </header>

      <div className="stats-grid">
        <Link to="/products" className="stat-card card" style={{textDecoration:'none',color:'inherit'}}>
          <span className="stat-label">Sản phẩm</span>
          <span className="stat-value">{overview.totalBooks}</span>
        </Link>
        <Link to="/orders" className="stat-card card" style={{textDecoration:'none',color:'inherit'}}>
          <span className="stat-label">Đơn hàng</span>
          <span className="stat-value">{overview.totalOrders}</span>
        </Link>
        <Link to="/revenue" className="stat-card card" style={{textDecoration:'none',color:'inherit'}}>
          <span className="stat-label">Doanh thu</span>
          <span className="stat-value">{formatVND(overview.totalRevenue)}</span>
        </Link>
        <Link to="/users" className="stat-card card" style={{textDecoration:'none',color:'inherit'}}>
          <span className="stat-label">Người dùng</span>
          <span className="stat-value">{overview.totalUsers}</span>
        </Link>
      </div>

      <div className="card">
        <div className="chart-header">
          <h3>Đơn hàng gần đây</h3>
          <Link to="/orders" className="btn ghost">Xem tất cả →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Trạng thái</th>
                <th>Tổng tiền</th>
                <th>Ngày</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="small">#{o.id.slice(-6).toUpperCase()}</td>
                  <td>{o.fullName}</td>
                  <td><span className={statusBadge(o.status)}>{statusLabel(o.status)}</span></td>
                  <td><strong>{formatVND(o.totalAmount)}</strong></td>
                  <td className="muted small">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="muted" style={{textAlign:'center',padding:'1.5rem'}}>Chưa có đơn hàng</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

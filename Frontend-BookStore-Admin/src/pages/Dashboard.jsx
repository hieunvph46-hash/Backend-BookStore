import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Wallet,
  Users,
  CalendarClock,
  TrendingUp,
  UserPlus,
  AlertTriangle,
  Star,
  Activity,
  Plus,
  Tag,
  BadgePercent,
  Eye,
  PackagePlus,
  BookOpen,
  ShoppingCart,
  CheckCircle2,
  Percent,
  PackageX,
} from 'lucide-react';
import { api, assetUrl } from '../api/client';
import { useToast } from '../components/toastContext';
import LineChart from '../components/LineChart';
import DonutChart from '../components/DonutChart';
import OrderDetail from './OrderDetail';

function formatVND(n) {
  return (n || 0).toLocaleString('vi-VN') + ' đ';
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

function StatusBadge({ status }) {
  const map = {
    pending: ['badge-pending', 'Chờ xử lý'],
    confirmed: ['badge-confirmed', 'Đã xác nhận'],
    shipping: ['badge-shipping', 'Đang giao'],
    delivered: ['badge-delivered', 'Đã giao'],
    cancelled: ['badge-cancelled', 'Đã hủy'],
  };
  const [cls, label] = map[status] || ['badge-user', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function ChangePill({ value }) {
  if (!value) return <span className="stat-change flat">— Hôm qua</span>;
  const up = value > 0;
  return (
    <span className={`stat-change ${up ? 'up' : 'down'}`}>
      {up ? <TrendingUp size={13} /> : <span style={{ transform: 'scaleY(-1)', display: 'inline-flex' }}><TrendingUp size={13} /></span>}
      {Math.abs(value)}% so với hôm qua
    </span>
  );
}

function StatCard({ icon: Icon, label, value, change, tone }) {
  return (
    <div className={`card stat-card tone-${tone}`}>
      <div className="stat-icon">
        <Icon size={22} strokeWidth={2.2} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <ChangePill value={change} />
    </div>
  );
}

function TodayStat({ icon: Icon, label, value, tone, to }) {
  const inner = (
    <div className={`card stat-card tone-${tone}`}>
      <div className="stat-icon">
        <Icon size={22} strokeWidth={2.2} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link> : inner;
}

function BookCover({ src, title, size = 'md' }) {
  if (src) return <img src={assetUrl(src)} alt={title || ''} className="book-cover" style={size === 'sm' ? { width: 36, height: 50 } : undefined} />;
  return (
    <div className="book-cover-fallback" style={size === 'sm' ? { width: 36, height: 50 } : undefined}>
      <BookOpen size={18} />
    </div>
  );
}

const ACTIVITY_META = {
  order: { icon: ShoppingCart, cls: 'order' },
  stock: { icon: PackageX, cls: 'stock' },
  user: { icon: UserPlus, cls: 'user' },
  book: { icon: BookOpen, cls: 'book' },
  rating: { icon: Star, cls: 'rating' },
};

const DONUT_COLORS = {
  delivered: '#2563eb',
  pending: '#f59e0b',
  confirmed: '#8b5cf6',
  cancelled: '#ef4444',
};

const QUICK_ACTIONS = [
  { label: 'Thêm sách', icon: Plus, to: '/products/new', tone: 'blue', desc: 'Tạo sản phẩm mới' },
  { label: 'Thêm danh mục', icon: Tag, to: '/categories', tone: 'violet', desc: 'Phân loại sách' },
  { label: 'Thêm tài khoản', icon: UserPlus, to: '/users', tone: 'green', desc: 'Quản lý người dùng' },
  { label: 'Tạo mã giảm giá', icon: BadgePercent, to: '/discounts', tone: 'amber', desc: 'Khuyến mãi' },
];

export default function Dashboard() {
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [restocking, setRestocking] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.get('/api/admin/stats/dashboard');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRestock = async (id, title) => {
    setRestocking((p) => ({ ...p, [id]: true }));
    try {
      await api.patch(`/api/admin/books/${id}/stock`, { quantity: 50 });
      toast(`Đã nhập thêm 50 cuốn "${title}"`, 'success');
      await load();
    } catch (err) {
      toast(err.response?.data?.error || 'Nhập thêm thất bại', 'error');
    } finally {
      setRestocking((p) => ({ ...p, [id]: false }));
    }
  };

  const lastUpdated = new Date().toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (loading) {
    return (
      <div>
        <div className="stats-grid">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
        </div>
        <div className="dash-grid-2">
          <div className="skeleton" style={{ height: 320 }} />
          <div className="skeleton" style={{ height: 320 }} />
        </div>
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card empty-state">
        <div className="empty-icon"><AlertTriangle size={26} /></div>
        <p>{error}</p>
        <button className="btn primary" onClick={load} style={{ marginTop: 12 }}>Thử lại</button>
      </div>
    );
  }

  const { totals, today, revenue7d, statusDistribution, topBooks, lowStock, newCustomers, recentOrders, recentActivity, monthly } = data;

  const donutData = statusDistribution
    .filter((s) => s.value > 0)
    .map((s) => ({ ...s, color: DONUT_COLORS[s.status] || '#94a3b8' }));

  const miniStats = [
    { label: 'Doanh thu tháng này', value: formatVND(monthly.revenue), icon: Wallet, tone: 'blue' },
    { label: 'Doanh thu tháng trước', value: formatVND(monthly.lastMonthRevenue), icon: CalendarClock, tone: 'violet' },
    { label: 'Trung bình đơn hàng', value: formatVND(monthly.avgOrder), icon: ShoppingBag, tone: 'green' },
    { label: 'Tỷ lệ hoàn thành đơn', value: `${monthly.completionRate}%`, icon: CheckCircle2, tone: 'cyan' },
    { label: 'Tổng lượt đánh giá', value: monthly.totalReviews, icon: Star, tone: 'amber' },
    { label: 'Điểm đánh giá trung bình', value: monthly.avgRating ? `${monthly.avgRating}/5` : '—', icon: Percent, tone: 'rose' },
  ];

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Tổng quan Dashboard</h2>
          <p className="muted">Theo dõi hoạt động kinh doanh BookStore của bạn</p>
        </div>
        <button className="btn secondary" onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} />
          Làm mới
        </button>
      </header>

      <div className="stats-grid">
        <StatCard icon={Package} label="Tổng sản phẩm" value={totals.books} change={totals.booksChange} tone="blue" />
        <StatCard icon={ShoppingBag} label="Tổng đơn hàng" value={totals.orders} change={totals.ordersChange} tone="violet" />
        <StatCard icon={Wallet} label="Tổng doanh thu" value={formatVND(totals.revenue)} change={totals.revenueChange} tone="green" />
        <StatCard icon={Users} label="Tổng người dùng" value={totals.users} change={totals.usersChange} tone="amber" />
      </div>

      <div className="stats-grid" style={{ marginBottom: 18 }}>
        <TodayStat icon={CalendarClock} label="Đơn hàng hôm nay" value={today.orders} tone="blue" to="/orders" />
        <TodayStat icon={Wallet} label="Doanh thu hôm nay" value={formatVND(today.revenue)} tone="green" to="/revenue" />
        <TodayStat icon={UserPlus} label="Khách hàng mới" value={today.newUsers} tone="violet" to="/users" />
        <TodayStat icon={AlertTriangle} label="Sản phẩm sắp hết" value={today.lowStock} tone="rose" to="/products" />
      </div>

      <div className="dash-grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title"><TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Doanh thu 7 ngày gần đây</h3>
              <p className="card-sub">Tổng doanh thu theo ngày (không gồm đơn đã hủy)</p>
            </div>
            <span className="badge badge-admin">7 ngày</span>
          </div>
          <LineChart data={revenue7d.map((d) => ({ label: d.label, date: d.date, value: d.revenue, orders: d.orders }))} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title"><ShoppingBag size={18} style={{ color: 'var(--primary)' }} /> Trạng thái đơn hàng</h3>
              <p className="card-sub">Trong tháng hiện tại</p>
            </div>
          </div>
          {donutData.length === 0 ? (
            <div className="empty-state"><p>Chưa có dữ liệu</p></div>
          ) : (
            <DonutChart data={donutData} centerLabel="Đơn" />
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div>
            <h3 className="card-title">Đơn hàng gần đây</h3>
            <p className="card-sub">5 đơn hàng mới nhất</p>
          </div>
          <Link to="/orders" className="btn ghost">Xem tất cả <span style={{ marginLeft: 2 }}>→</span></Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td><span className="code-chip">#{o.code}</span></td>
                  <td>
                    <div className="customer-cell">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.72rem' }}>{o.fullName?.[0]?.toUpperCase() || 'U'}</div>
                      <div>
                        <strong>{o.fullName}</strong>
                        <small>{o.email}</small>
                      </div>
                    </div>
                  </td>
                  <td className="muted small">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td><strong>{formatVND(o.totalAmount)}</strong></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn secondary" style={{ padding: '6px 12px' }} onClick={() => setSelectedOrder(o)}>
                      <Eye size={15} /> Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có đơn hàng</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dash-grid-equal">
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Top 5 sách bán chạy</h3>
              <p className="card-sub">Theo số lượng đã bán</p>
            </div>
          </div>
          {topBooks.length === 0 ? (
            <div className="empty-state"><p>Chưa có dữ liệu</p></div>
          ) : (
            <div>
              {topBooks.map((row, idx) => (
                <div className="list-row" key={idx}>
                  <span className={`rank-num ${idx === 0 ? 'top' : ''}`}>{idx + 1}</span>
                  <BookCover src={row.book?.coverImage} title={row.book?.title} size="sm" />
                  <div className="grow">
                    <strong>{row.book?.title || 'Sách đã xóa'}</strong>
                    <small>{row.book?.author}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{row.totalQuantity} đã bán</strong>
                    <small style={{ display: 'block' }}>{formatVND(row.totalRevenue)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Sản phẩm sắp hết hàng</h3>
              <p className="card-sub">Tồn kho ≤ 10 cuốn</p>
            </div>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Package size={26} /></div>
              <p>Không có sản phẩm nào sắp hết hàng</p>
            </div>
          ) : (
            <div>
              {lowStock.map((b) => (
                <div className="list-row" key={b.id}>
                  <BookCover src={b.coverImage} title={b.title} size="sm" />
                  <div className="grow">
                    <strong>{b.title}</strong>
                    <small>{b.author}</small>
                  </div>
                  <span className={`stock-pill ${b.stock <= 5 ? 'low' : 'medium'}`}>Còn {b.stock}</span>
                  <button
                    className="btn primary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => onRestock(b.id, b.title)}
                    disabled={restocking[b.id]}
                  >
                    <PackagePlus size={14} />
                    {restocking[b.id] ? '…' : 'Nhập thêm'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dash-grid-equal">
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Khách hàng mới</h3>
              <p className="card-sub">Tài khoản mới đăng ký</p>
            </div>
          </div>
          {newCustomers.length === 0 ? (
            <div className="empty-state"><p>Chưa có dữ liệu</p></div>
          ) : (
            <div>
              {newCustomers.map((u) => (
                <div className="list-row" key={u.id}>
                  <div className="avatar">{u.name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'U'}</div>
                  <div className="grow">
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </div>
                  <small style={{ whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Hoạt động gần đây</h3>
              <p className="card-sub">Nhật ký hoạt động gần nhất</p>
            </div>
          </div>
          <div>
            {recentActivity.map((a, i) => {
              const meta = ACTIVITY_META[a.type] || ACTIVITY_META.order;
              return (
                <div className="activity-row" key={i}>
                  <span className={`activity-icon ${meta.cls}`}>
                    <meta.icon size={16} />
                  </span>
                  <div className="grow">
                    <p>{a.message}</p>
                    <time>{timeAgo(a.time)}</time>
                  </div>
                </div>
              );
            })}
            {recentActivity.length === 0 && <div className="empty-state"><p>Chưa có hoạt động</p></div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div>
            <h3 className="card-title">Truy cập nhanh</h3>
            <p className="card-sub">Thao tác phổ biến</p>
          </div>
        </div>
        <div className="quick-actions">
          {QUICK_ACTIONS.map((qa) => (
            <button key={qa.label} className="quick-action" onClick={() => navigate(qa.to)}>
              <span className={`qa-icon tone-${qa.tone}`}><qa.icon size={19} /></span>
              <span>
                {qa.label}
                <small style={{ display: 'block', fontWeight: 400, color: 'var(--text-3)', fontSize: '0.74rem' }}>{qa.desc}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div>
            <h3 className="card-title"><Percent size={18} style={{ color: 'var(--primary)' }} /> Thống kê chi tiết</h3>
            <p className="card-sub">Hiệu quả kinh doanh tổng quan</p>
          </div>
        </div>
        <div className="mini-stats">
          {miniStats.map((s) => (
            <div className="mini-stat" key={s.label}>
              <span className={`ms-icon tone-${s.tone}`}><s.icon size={18} /></span>
              <div>
                <div className="ms-value">{s.value}</div>
                <div className="ms-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="dash-footer">
        <Activity size={14} />
        Cập nhật lần cuối: {lastUpdated}
      </footer>

      {selectedOrder && <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}

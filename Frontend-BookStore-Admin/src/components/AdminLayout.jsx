import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Tags,
  ShoppingBag,
  Users,
  Star,
  TicketPercent,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  KeyRound,
  LogOut,
  ShoppingCart,
  PackageX,
  UserPlus,
  Library,
} from 'lucide-react';
import { useAuth } from '../auth/authContext';
import { api } from '../api/client';

const NAV_SECTIONS = [
  {
    title: 'Tổng quan',
    items: [{ to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Quản lý',
    items: [
      { to: '/products', label: 'Quản lý Sách', icon: BookOpen },
      { to: '/categories', label: 'Danh mục', icon: Tags },
      { to: '/orders', label: 'Đơn hàng', icon: ShoppingBag },
      { to: '/users', label: 'Người dùng', icon: Users },
    ],
  },
  {
    title: 'Bán hàng',
    items: [
      { to: '/reviews', label: 'Đánh giá', icon: Star },
      { to: '/discounts', label: 'Mã giảm giá', icon: TicketPercent },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: '/revenue', label: 'Thống kê', icon: BarChart3 },
      { to: '/settings', label: 'Cài đặt', icon: Settings },
    ],
  },
];

function ClickOutside({ onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return <div ref={ref}>{children}</div>;
}

const NOTIF_ICONS = {
  order: { icon: ShoppingCart, cls: 'order' },
  stock: { icon: PackageX, cls: 'stock' },
  user: { icon: UserPlus, cls: 'user' },
  book: { icon: Library, cls: 'book' },
  rating: { icon: Star, cls: 'rating' },
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState({ count: 0, items: [] });
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/api/admin/stats/dashboard')
      .then(({ data }) => {
        const d = data.data || {};
        setNotifications({
          count: d.notifications?.count || 0,
          items: d.notifications?.items || [],
        });
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() || user.email?.[0]?.toUpperCase() || 'A'
    : 'A';

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/products${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`);
    setSearch('');
  };

  const closeMenus = () => {
    setNotifOpen(false);
    setProfileOpen(false);
  };

  const linkClass = ({ isActive }) => (isActive ? 'active' : '');

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand-logo">
            <BookOpen size={20} />
          </div>
          <div className="brand-text">
            <h1 className="brand">BookStore</h1>
            <span className="brand-sub">Admin Panel</span>
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu">
            <X size={20} />
          </button>
        </div>
        <nav>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="nav-section-title">{section.title}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={linkClass}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={19} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main">
        <header className="header">
          <button className="icon-btn mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Mở menu">
            <Menu size={20} />
          </button>

          <div className="header-title">
            <h1>Xin chào Admin</h1>
            <p>{today}</p>
          </div>

          <form className="header-search" onSubmit={onSearch}>
            <Search size={18} />
            <input
              type="search"
              placeholder="Tìm kiếm sách, tác giả…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="header-actions">
            <div className="header-notif">
              <ClickOutside onClose={() => setNotifOpen(false)}>
                <div style={{ position: 'relative' }}>
                  <button className="icon-btn" onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }} aria-label="Thông báo">
                    <Bell size={20} />
                    {notifications.count > 0 && (
                      <span className="notif-badge">{notifications.count > 9 ? '9+' : notifications.count}</span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="dropdown" style={{ maxWidth: 340 }}>
                      <div className="dropdown-header">
                        <span>Thông báo</span>
                        <span className="badge badge-admin">{notifications.count}</span>
                      </div>
                      {notifications.items.length === 0 ? (
                        <div className="empty-state" style={{ padding: '20px 16px' }}>
                          <p>Không có thông báo mới</p>
                        </div>
                      ) : (
                        notifications.items.map((n, i) => {
                          const meta = NOTIF_ICONS[n.icon] || NOTIF_ICONS.order;
                          return (
                            <div key={i} className="notif-item" onClick={() => { setNotifOpen(false); navigate('/orders'); }}>
                              <span className={`notif-icon ${meta.cls}`}>
                                <meta.icon size={17} />
                              </span>
                              <div>
                                <p>{n.text}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </ClickOutside>
            </div>

            <div className="header-profile">
              <ClickOutside onClose={() => setProfileOpen(false)}>
                <button className="profile-btn" onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}>
                  <div className="avatar">{initials}</div>
                  <span className="profile-meta">
                    <span className="profile-name">{user?.firstName} {user?.lastName}</span>
                    <br />
                    <span className="profile-email">{user?.email}</span>
                  </span>
                  <ChevronDown size={16} style={{ color: '#94a3b8' }} />
                </button>
                {profileOpen && (
                  <div className="dropdown profile-menu">
                    <div className="profile-menu-head">
                      <div className="pname">{user?.firstName} {user?.lastName}</div>
                      <div className="pemail">{user?.email}</div>
                    </div>
                    <button className="profile-menu-item" onClick={() => { closeMenus(); navigate('/change-password'); }}>
                      <KeyRound size={16} />
                      Đổi mật khẩu
                    </button>
                    <button className="profile-menu-item danger" onClick={handleLogout}>
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </ClickOutside>
            </div>
          </div>
        </header>

        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

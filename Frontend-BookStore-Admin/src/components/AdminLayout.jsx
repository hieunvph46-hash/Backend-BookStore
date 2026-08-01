import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) => (isActive ? 'active' : '');

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() || user.email?.[0]?.toUpperCase() || 'A'
    : 'A';

  const nav = (
    <>
      <div className="sidebar-top">
        <h1 className="brand">BookStore Admin</h1>
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(false)}>✕</button>
      </div>
      <nav>
        <NavLink to="/" end className={linkClass} onClick={() => setSidebarOpen(false)}>📊 Tổng quan</NavLink>
        <NavLink to="/products" className={linkClass} onClick={() => setSidebarOpen(false)}>📦 Sản phẩm</NavLink>
        <NavLink to="/orders" className={linkClass} onClick={() => setSidebarOpen(false)}>📋 Đơn hàng</NavLink>
        <NavLink to="/revenue" className={linkClass} onClick={() => setSidebarOpen(false)}>💰 Doanh thu</NavLink>
        <NavLink to="/carts" className={linkClass} onClick={() => setSidebarOpen(false)}>🛒 Giỏ hàng</NavLink>
        <NavLink to="/users" className={linkClass} onClick={() => setSidebarOpen(false)}>👥 Tài khoản</NavLink>
        <NavLink to="/settings" className={linkClass} onClick={() => setSidebarOpen(false)}>⚙️ Cài đặt</NavLink>
      </nav>
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
          <div className="sidebar-user-email">{user?.email}</div>
        </div>
        <div style={{display:'flex',gap:'0.35rem'}}>
          <NavLink to="/change-password" className="sidebar-logout" onClick={() => setSidebarOpen(false)} title="Đổi mật khẩu">🔑</NavLink>
          <button className="sidebar-logout" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </div>
    </>
  );

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {nav}
      </aside>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <main className="main">
        <button className="sidebar-toggle mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        <Outlet />
      </main>
    </div>
  );
}

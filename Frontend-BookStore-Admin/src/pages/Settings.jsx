import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Settings() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/api/auth/profile').then(({ data }) => setProfile(data.user || data.data)).catch(() => {});
  }, []);

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Cài đặt</h2>
          <p className="muted">Thông tin hệ thống và tài khoản</p>
        </div>
      </header>

      {profile && (
        <div className="card" style={{maxWidth:560,marginBottom:'1rem'}}>
          <h3>Thông tin tài khoản</h3>
          <div style={{display:'flex',alignItems:'center',gap:'1rem',marginTop:'0.5rem'}}>
            <div className="sidebar-avatar" style={{width:56,height:56,fontSize:'1.3rem'}}>
              {((profile.firstName?.[0] || '') + (profile.lastName?.[0] || '')).toUpperCase() || profile.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <strong style={{fontSize:'1.1rem'}}>{profile.firstName} {profile.lastName}</strong>
              <div className="muted">{profile.email}</div>
              <span className={`badge ${profile.role === 'admin' ? 'badge-admin' : profile.role === 'staff' ? 'badge-staff' : 'badge-user'}`}>
                {profile.role === 'admin' ? 'Quản trị' : profile.role === 'staff' ? 'Nhân viên' : 'Người dùng'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{maxWidth:560,marginBottom:'1rem'}}>
        <h3>Thông tin hệ thống</h3>
        <table>
          <tbody>
            <tr><td style={{border:'none',padding:'0.35rem 0',fontWeight:600}}>Tên ứng dụng</td><td style={{border:'none',padding:'0.35rem 0'}}>BookStore Admin</td></tr>
            <tr><td style={{border:'none',padding:'0.35rem 0',fontWeight:600}}>Phiên bản</td><td style={{border:'none',padding:'0.35rem 0'}}>2.0.0</td></tr>
            <tr><td style={{border:'none',padding:'0.35rem 0',fontWeight:600}}>API Server</td><td style={{border:'none',padding:'0.35rem 0'}}>{import.meta.env.VITE_API_URL || 'http://localhost:3000'}</td></tr>
            <tr><td style={{border:'none',padding:'0.35rem 0',fontWeight:600}}>Frontend Framework</td><td style={{border:'none',padding:'0.35rem 0'}}>React + Vite</td></tr>
            <tr><td style={{border:'none',padding:'0.35rem 0',fontWeight:600}}>Cơ sở dữ liệu</td><td style={{border:'none',padding:'0.35rem 0'}}>MongoDB</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card" style={{maxWidth:560}}>
        <h3>Hướng dẫn nhanh</h3>
        <ul style={{paddingLeft:'1.2rem',lineHeight:2}}>
          <li><strong>Sản phẩm</strong> — Thêm, sửa, xóa sách. Upload ảnh bìa, tìm kiếm, lọc danh mục, sắp xếp.</li>
          <li><strong>Đơn hàng</strong> — Xem danh sách, lọc trạng thái, cập nhật trạng thái giao hàng.</li>
          <li><strong>Doanh thu</strong> — Thống kê doanh thu biểu đồ, xuất CSV, xem top sản phẩm bán chạy.</li>
          <li><strong>Giỏ hàng</strong> — Xem giỏ hàng người dùng, cập nhật số lượng, xóa sản phẩm, thanh toán hộ.</li>
          <li><strong>Tài khoản</strong> — Quản lý người dùng, phân quyền, khóa/tạm khóa tài khoản.</li>
        </ul>
      </div>
    </div>
  );
}

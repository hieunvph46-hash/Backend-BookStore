import { useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

export default function ChangePassword() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast('Đổi mật khẩu thành công', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Đổi mật khẩu</h2>
        </div>
      </header>
      <form className="card form-card" onSubmit={onSubmit} style={{maxWidth:400}}>
        {error ? <p className="error">{error}</p> : null}
        <label>
          Mật khẩu hiện tại *
          <input name="currentPassword" type="password" value={form.currentPassword} onChange={onChange} required autoComplete="current-password" />
        </label>
        <label>
          Mật khẩu mới *
          <input name="newPassword" type="password" value={form.newPassword} onChange={onChange} required minLength={6} autoComplete="new-password" />
        </label>
        <label>
          Xác nhận mật khẩu *
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} required autoComplete="new-password" />
        </label>
        <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Đang xử lý…' : 'Đổi mật khẩu'}</button>
      </form>
    </div>
  );
}

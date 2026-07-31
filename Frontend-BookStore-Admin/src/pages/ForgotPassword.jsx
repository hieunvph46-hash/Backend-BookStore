import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [step, setStep] = useState('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      setMessage(data.message);
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setStep('reset');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/reset-password', { token: resetToken, newPassword });
      setMessage(data.message);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>Quên mật khẩu</h1>
        {error ? <p className="error">{error}</p> : null}
        {message ? <p style={{color:'#16a34a',margin:'0.5rem 0'}}>{message}</p> : null}

        {step === 'email' && (
          <form onSubmit={requestReset}>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <button type="submit" className="btn primary" disabled={loading} style={{width:'100%'}}>
              {loading ? 'Đang xử lý…' : 'Gửi yêu cầu'}
            </button>
            <p className="muted" style={{marginTop:'0.75rem'}}>
              <Link to="/login">← Quay lại đăng nhập</Link>
            </p>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={submitReset}>
            <label>
              Mật khẩu mới *
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </label>
            <label>
              Xác nhận mật khẩu *
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </label>
            <button type="submit" className="btn primary" disabled={loading} style={{width:'100%'}}>
              {loading ? 'Đang xử lý…' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <Link to="/login" className="btn primary" style={{display:'block',textAlign:'center'}}>← Đăng nhập</Link>
        )}
      </div>
    </div>
  );
}

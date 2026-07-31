import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

function formatVND(n) { return (n || 0).toLocaleString('vi-VN') + ' đ'; }

export default function CartsPage() {
  const toast = useToast();
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [checkoutTarget, setCheckoutTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/admin/carts');
      setCarts(data.carts || data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Không tải được giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onUpdateQty = async (userId, bookId, qty) => {
    try {
      const { data } = await api.put(`/api/admin/carts/${userId}/items/${bookId}`, { quantity: qty });
      const updated = data.cart;
      setCarts((prev) => prev.map((c) => {
        if (c.user?.id !== userId) return c;
        const items = c.items.map((i) => {
          if (i.book?.id !== bookId) return i;
          const line = updated.items.find((u) => u.book?.id === bookId || u.id === i.id);
          return line || { ...i, quantity: qty };
        });
        const totalAmount = updated.totalAmount || items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
        const itemCount = items.filter((i) => i.book).length;
        return { ...c, items, totalAmount, itemCount };
      }));
      toast('Đã cập nhật số lượng', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Cập nhật thất bại', 'error');
    }
  };

  const onDeleteItem = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/carts/${deleteTarget.userId}/items/${deleteTarget.bookId}`);
      setCarts((prev) => prev.map((c) => {
        if (c.user?.id !== deleteTarget.userId) return c;
        const items = c.items.filter((i) => i.book?.id !== deleteTarget.bookId);
        const totalAmount = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
        return { ...c, items, totalAmount, itemCount: items.length };
      }));
      toast('Đã xóa sản phẩm khỏi giỏ', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Xóa thất bại', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const onCheckout = async () => {
    if (!checkoutTarget) return;
    try {
      await api.post(`/api/admin/carts/${checkoutTarget.userId}/checkout`);
      setCarts((prev) => prev.map((c) => {
        if (c.user?.id !== checkoutTarget.userId) return c;
        return { ...c, items: [], totalAmount: 0, itemCount: 0 };
      }));
      toast('Đã thanh toán giỏ hàng thành công', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Thanh toán thất bại', 'error');
    } finally {
      setCheckoutTarget(null);
    }
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Giỏ hàng khách</h2>
          <p className="muted">Quản lý giỏ hàng đang lưu trên hệ thống</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Đang tải…</p> : null}

      {!loading && (
        <div className="stack">
          {carts.map((cart) => (
            <article key={cart.id} className="card order-card">
              <div className="order-head">
                <div>
                  <strong>{cart.user?.email || cart.user?.username || 'Khách'}</strong>
                  <div className="muted small">
                    {cart.itemCount || 0} sản phẩm · cập nhật{' '}
                    {cart.updatedAt ? new Date(cart.updatedAt).toLocaleString('vi-VN') : '—'}
                  </div>
                </div>
                <div className="order-meta">
                  <strong>{formatVND(cart.totalAmount)}</strong>
                </div>
              </div>
              {cart.itemCount === 0 ? (
                <p className="muted">Giỏ trống</p>
              ) : (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th style={{width:80}}>Số lượng</th>
                          <th style={{width:120}}>Đơn giá</th>
                          <th style={{width:120}}>Thành tiền</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {(cart.items || []).filter((i) => i.book).map((line) => (
                          <tr key={line.id}>
                            <td>{line.book?.title}</td>
                            <td>
                              <input
                                type="number" min="1"
                                style={{width:60,padding:'0.3rem',border:'1px solid #d1d5db',borderRadius:6}}
                                value={line.quantity}
                                onChange={(e) => {
                                  const qty = parseInt(e.target.value, 10);
                                  if (qty >= 1) onUpdateQty(cart.user?.id, line.book.id, qty);
                                }}
                              />
                            </td>
                            <td>{formatVND(line.price)}</td>
                            <td>{formatVND(line.subtotal)}</td>
                            <td className="actions">
                              <button className="btn icon-btn danger" title="Xóa"
                                onClick={() => setDeleteTarget({ userId: cart.user?.id, bookId: line.book.id })}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="form-actions" style={{marginTop:'0.5rem'}}>
                    <button className="btn primary" onClick={() => setCheckoutTarget(cart)}>Thanh toán</button>
                  </div>
                </>
              )}
            </article>
          ))}
          {carts.length === 0 ? <p className="muted" style={{textAlign:'center',padding:'2rem'}}>Không có dữ liệu</p> : null}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa sản phẩm"
        message="Xóa sản phẩm này khỏi giỏ hàng?"
        onConfirm={onDeleteItem}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={!!checkoutTarget}
        title="Thanh toán giỏ hàng"
        message={`Xác nhận thanh toán giỏ hàng của ${checkoutTarget?.user?.email || 'khách'}?`}
        onConfirm={onCheckout}
        onCancel={() => setCheckoutTarget(null)}
      />
    </div>
  );
}

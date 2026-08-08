function formatVND(n) { return (n || 0).toLocaleString('vi-VN') + ' đ'; }

function statusLabel(value) {
  const labels = { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy' };
  return labels[value] || value;
}

export default function OrderDetail({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()} style={{maxWidth:640}}>
        <h2 style={{marginTop:0}}>Đơn hàng #{order.id.slice(-6).toUpperCase()}</h2>
        <div className="stack" style={{gap:'0.5rem'}}>
          <div className="order-head" style={{display:'flex',justifyContent:'space-between'}}>
            <div>
              <p style={{margin:0}}><strong>Khách hàng:</strong> {order.fullName}</p>
              <p style={{margin:0}} className="muted">{order.phone} · {order.address}</p>
              {order.city ? <p style={{margin:0}} className="muted">{order.city}</p> : null}
              {order.notes ? <p style={{margin:0}} className="muted"><em>Ghi chú: {order.notes}</em></p> : null}
            </div>
            <div className="order-meta" style={{textAlign:'right'}}>
              <span className={`badge ${order.status === 'pending' ? 'badge-pending' : order.status === 'confirmed' ? 'badge-confirmed' : order.status === 'shipping' ? 'badge-shipping' : order.status === 'delivered' ? 'badge-delivered' : 'badge-cancelled'}`}>{statusLabel(order.status)}</span>
              <span className="muted small">{order.paymentMethod === 'cash_on_delivery' ? 'Thanh toán khi nhận hàng' : order.paymentMethod}</span>
              <span className="muted small">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SL</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((line, idx) => (
                <tr key={idx}>
                  <td>{line.book?.title || 'Đã xóa'}</td>
                  <td>{line.quantity}</td>
                  <td>{formatVND(line.price)}</td>
                  <td>{formatVND(line.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{textAlign:'right',fontWeight:600}}>Phí ship:</td>
                <td>{formatVND(order.shippingFee || 30000)}</td>
              </tr>
              {order.discountCode ? (
                <tr>
                  <td colSpan={3} style={{textAlign:'right',fontWeight:600,color:'#16a34a'}}>Giảm giá ({order.discountCode}):</td>
                  <td style={{color:'#16a34a',fontWeight:600}}>- {formatVND(order.discountAmount)}</td>
                </tr>
              ) : null}
              <tr>
                <td colSpan={3} style={{textAlign:'right',fontWeight:700,fontSize:'1.1rem'}}>Tổng:</td>
                <td style={{fontWeight:700,fontSize:'1.1rem'}}>{formatVND(order.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="form-actions" style={{marginTop:'1rem'}}>
          <button className="btn secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

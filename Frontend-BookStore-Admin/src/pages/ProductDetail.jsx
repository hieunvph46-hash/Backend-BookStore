import { assetUrl } from '../api/client';

function formatVND(n) { return (n || 0).toLocaleString('vi-VN') + ' đ'; }

export default function ProductDetail({ book, onClose }) {
  if (!book) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card product-detail-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth:600}}>
        <div className="product-detail-layout">
          <div className="product-detail-image">
            {book.coverImage || book.image ? (
              <img src={assetUrl(book.coverImage || book.image)} alt={book.title} />
            ) : (
              <div className="thumb-placeholder" style={{width:'100%',height:200,fontSize:48}}>📖</div>
            )}
          </div>
          <div className="product-detail-info">
            <h2 style={{margin:'0 0 0.5rem'}}>{book.title}</h2>
            <p className="muted" style={{margin:'0 0 0.25rem'}}><strong>Tác giả:</strong> {book.author}</p>
            <p className="muted" style={{margin:'0 0 0.25rem'}}><strong>Danh mục:</strong> {book.category?.name || '—'}</p>
            <p style={{margin:'0.5rem 0',fontSize:'1.2rem',fontWeight:700,color:'#2563eb'}}>{formatVND(book.price)}</p>
            <p style={{margin:'0.5rem 0'}}><strong>Mô tả:</strong><br/>{book.description || 'Chưa có mô tả'}</p>
          </div>
        </div>
        <div className="form-actions" style={{marginTop:'1rem'}}>
          <button className="btn secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>{title || 'Xác nhận'}</h3>
        <p>{message}</p>
        <div className="form-actions">
          <button className="btn danger" onClick={onConfirm}>
            Xác nhận
          </button>
          <button className="btn secondary" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

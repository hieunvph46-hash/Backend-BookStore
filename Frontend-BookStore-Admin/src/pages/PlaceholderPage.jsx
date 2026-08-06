import { Plus } from 'lucide-react';

export default function PlaceholderPage({ icon: Icon, title, subtitle, description, badge }) {
  return (
    <div>
      <header className="page-header">
        <div>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
        <button className="btn primary" disabled style={{ opacity: 0.6 }}>
          <Plus size={17} /> Thêm mới
        </button>
      </header>

      <div className="card">
        <div className="empty-state" style={{ padding: '64px 16px' }}>
          <div className="empty-icon" style={{ width: 76, height: 76, borderRadius: 22 }}>
            <Icon size={34} />
          </div>
          <h3 style={{ margin: '16px 0 6px', fontSize: '1.05rem' }}>{badge}</h3>
          <p style={{ maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>{description}</p>
        </div>
      </div>
    </div>
  );
}

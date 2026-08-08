export default function Pagination({ page, limit, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) pages.push(1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('...');
  if (end < totalPages) pages.push(totalPages);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Hiển thị {from}–{to}/{total}
      </span>
      <div className="pagination-pages">
        <button className="btn pagination-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ‹
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="pagination-dots">…</span>
          ) : (
            <button
              key={p}
              className={`btn pagination-btn ${p === page ? 'active' : ''}`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button className="btn pagination-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          ›
        </button>
      </div>
      <span className="pagination-total">Tổng: {total}</span>
    </div>
  );
}

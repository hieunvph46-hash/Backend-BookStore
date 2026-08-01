import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

function formatVND(n) { return (n || 0).toLocaleString('vi-VN') + ' đ'; }

function downloadCSV(data, filename) {
  const header = 'Kỳ,Doanh thu,Số đơn\n';
  const rows = data.map((r) => `"${r.label}",${r.revenue},${r.orderCount}`).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RevenuePage() {
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [groupBy, setGroupBy] = useState('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, rev, top] = await Promise.all([
        api.get('/api/admin/stats/overview'),
        api.get('/api/admin/stats/revenue', { params: { groupBy } }),
        api.get('/api/admin/stats/top-books', { params: { limit: 10 } }),
      ]);
      setOverview(ov.data.data);
      setRevenue(rev.data.data || []);
      setTopBooks(top.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Không tải được thống kê');
    } finally {
      setLoading(false);
    }
  }, [groupBy]);

  useEffect(() => { load(); }, [load]);

  const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1);

  const labelMap = { day: 'ngày', month: 'tháng', year: 'năm' };

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Doanh thu</h2>
          <p className="muted">Thống kê doanh thu và bán hàng</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Đang tải…</p> : null}

      {!loading && overview && (
        <>
          <div className="stats-grid">
            {[
              { label: 'Tổng doanh thu', value: formatVND(overview.totalRevenue) },
              { label: 'Đơn hàng', value: overview.totalOrders },
              { label: 'Người dùng', value: overview.totalUsers },
              { label: 'Sản phẩm', value: overview.totalBooks },
            ].map((s) => (
              <div key={s.label} className="stat-card card">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="card chart-section">
            <div className="chart-header">
              <h3>Biểu đồ doanh thu theo {labelMap[groupBy]}</h3>
              <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  <option value="day">Theo ngày</option>
                  <option value="month">Theo tháng</option>
                  <option value="year">Theo năm</option>
                </select>
                {revenue.length > 0 && (
                  <button className="btn secondary" onClick={() => downloadCSV(revenue, `doanh-thu-${groupBy}.csv`)}>
                    ⬇ CSV
                  </button>
                )}
              </div>
            </div>
            {revenue.length === 0 ? (
              <p className="muted">Chưa có dữ liệu doanh thu</p>
            ) : (
              <div className="bar-chart">
                {revenue.map((r, i) => (
                  <div key={i} className="bar-col">
                    <div className="bar-tooltip">{formatVND(r.revenue)}</div>
                    <div className="bar" style={{ height: `${(r.revenue / maxRevenue) * 100}%` }} />
                    <div className="bar-label">{r.label}</div>
                    <div className="bar-sub">{r.orderCount} đơn</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card chart-section">
            <h3>Top sản phẩm bán chạy</h3>
            {topBooks.length === 0 ? (
              <p className="muted">Chưa có dữ liệu</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Sản phẩm</th>
                      <th>Đã bán</th>
                      <th>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBooks.map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          {row.book ? (
                            <div className="top-book-cell">
                              <strong>{row.book.title}</strong>
                              <div className="muted small">{row.book.author}</div>
                            </div>
                          ) : 'Sách đã xóa'}
                        </td>
                        <td>{row.totalQuantity}</td>
                        <td>{formatVND(row.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

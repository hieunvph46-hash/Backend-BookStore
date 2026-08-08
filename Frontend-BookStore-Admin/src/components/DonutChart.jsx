export default function DonutChart({ data = [], size = 180, thickness = 22, centerLabel = 'Tổng' }) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const R = (size - thickness) / 2;
  const C = 2 * Math.PI * R;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const segments = data.map((d) => {
    const frac = total > 0 ? (d.value || 0) / total : 0;
    const seg = {
      ...d,
      dash: frac * C,
      offset,
    };
    offset += frac * C;
    return seg;
  });

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {segments.map((s, i) =>
            s.value > 0 ? (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            ) : null
          )}
        </g>
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="600">
          {centerLabel}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="22" fill="#0f172a" fontWeight="800">
          {total}
        </text>
      </svg>
      {total > 0 && (
        <div className="donut-legend">
          {segments.map((s, i) => (
            <div key={i} className="legend-row">
              <span className="legend-dot" style={{ background: s.color }} />
              <span className="legend-label">{s.label}</span>
              <span className="legend-value">{s.value}</span>
              <span className="legend-pct">{Math.round(((s.value || 0) / total) * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

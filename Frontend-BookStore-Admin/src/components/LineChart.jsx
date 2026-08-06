import { useMemo, useState } from 'react';

function formatCompact(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n || 0);
}

function formatVND(n) {
  return (n || 0).toLocaleString('vi-VN') + ' đ';
}

export default function LineChart({ data = [] }) {
  const [hover, setHover] = useState(null);

  const W = 700;
  const H = 240;
  const padL = 48;
  const padR = 16;
  const padT = 18;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const { points, gridLines } = useMemo(() => {
    const vals = data.map((d) => d.value || 0);
    const max = Math.max(...vals, 1);
    const niceMax = Math.ceil(max / 5) * 5 || 5;
    const pts = data.map((d, i) => ({
      x: innerW === 0 ? 0 : padL + (i / Math.max(data.length - 1, 1)) * innerW,
      y: padT + innerH - ((d.value || 0) / niceMax) * innerH,
      ...d,
    }));
    const tk = Array.from({ length: 5 }, (_, i) => Math.round((niceMax / 4) * i));
    const gl = tk.map((v) => ({
      y: padT + innerH - (v / niceMax) * innerH,
      label: formatCompact(v),
    }));
    return { points: pts, gridLines: gl };
  }, [data, innerW, innerH, padL, padT]);

  if (!data.length) return null;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`;

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - px);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHover(best);
  };

  const active = hover != null ? points[hover] : null;

  return (
    <div className="chart-wrap">
      {active && (
        <div
          className="chart-tooltip"
          style={{ left: active.x, top: active.y - 12 }}
        >
          <small>{active.date}</small>
          {formatVND(active.value)}
          {active.orders > 0 ? <small>{active.orders} đơn</small> : null}
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="line-chart-svg"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="lcArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lcLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>

        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={g.y} y2={g.y} stroke="#eef2f7" strokeWidth="1" />
            <text x={padL - 8} y={g.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {g.label}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#lcArea)" />
        <path d={linePath} fill="none" stroke="url(#lcLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 5.5 : 3.5}
            fill={hover === i ? '#fff' : '#2563eb'}
            stroke="#2563eb"
            strokeWidth={hover === i ? 3 : 2}
            style={{ transition: 'r 0.15s' }}
          />
        ))}

        {points.map((p, i) => (
          <text
            key={`l${i}`}
            x={p.x}
            y={H - 10}
            textAnchor="middle"
            fontSize="10.5"
            fontWeight={hover === i ? 700 : 500}
            fill={hover === i ? '#2563eb' : '#94a3b8'}
          >
            {p.label}
          </text>
        ))}

        {active && (
          <line x1={active.x} x2={active.x} y1={padT} y2={padT + innerH} stroke="#2563eb" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        )}
      </svg>
    </div>
  );
}

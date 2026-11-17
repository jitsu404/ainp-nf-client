import { fmt } from "../lib/results";

// Small SVG charts for results, no chart library. Values are drawn on a zero-based scale so bar
// heights compare honestly; the reference treatment is highlighted.

const PALETTE = [
  "#4a6b1e",
  "#2f6db5",
  "#c2782b",
  "#8a4fb0",
  "#1d9e75",
  "#b8433a",
  "#5f5e5a",
  "#c29b14",
];

const niceMax = (max) => {
  if (max <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / step) * step;
};

/** bars: [{ label, value, letters?, highlight? }] */
export function BarChart({ bars, height = 180, title }) {
  const shown = bars.filter((b) => b.value !== null && b.value !== undefined);
  if (!shown.length) return null;
  const max = niceMax(Math.max(...shown.map((b) => b.value)));
  const w = Math.max(240, bars.length * 64);
  const top = 22;
  const bottom = 26;
  const plot = height - top - bottom;
  const bw = Math.min(40, (w - 40) / bars.length - 14);
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      width="100%"
      style={{ maxWidth: w, display: "block" }}
      role="img"
      aria-label={title ?? "Treatment means"}
    >
      <title>{title ?? "Treatment means"}</title>
      <line
        x1={36}
        x2={w - 4}
        y1={top + plot}
        y2={top + plot}
        stroke="#c9cfc8"
      />
      <text x={32} y={top + 4} textAnchor="end" fontSize="10" fill="#6b7469">
        {fmt(max, 0)}
      </text>
      <text x={32} y={top + plot} textAnchor="end" fontSize="10" fill="#6b7469">
        0
      </text>
      {bars.map((b, i) => {
        const x =
          44 + i * ((w - 48) / bars.length) + ((w - 48) / bars.length - bw) / 2;
        const h = b.value ? (b.value / max) * plot : 0;
        return (
          <g key={b.label}>
            {b.value !== null && b.value !== undefined && (
              <>
                <rect
                  x={x}
                  y={top + plot - h}
                  width={bw}
                  height={h}
                  rx={3}
                  fill={b.highlight ? "#c2782b" : "#4a6b1e"}
                  opacity={b.highlight ? 0.9 : 0.8}
                >
                  <title>{`${b.label}: ${fmt(b.value)}`}</title>
                </rect>
                <text
                  x={x + bw / 2}
                  y={top + plot - h - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#333"
                >
                  {b.letters
                    ? `${fmt(b.value, 0)} ${b.letters}`
                    : fmt(b.value, 0)}
                </text>
              </>
            )}
            <text
              x={x + bw / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#333"
            >
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** xLabels: ['2024-25', …]; series: [{ name, values: [number|null per x] }] */
export function LineChart({ xLabels, series, height = 200, title }) {
  const all = series
    .flatMap((s) => s.values)
    .filter((v) => v !== null && v !== undefined);
  if (!all.length) return null;
  const max = niceMax(Math.max(...all));
  const w = Math.max(320, xLabels.length * 90);
  const left = 44;
  const top = 14;
  const bottom = 26;
  const plot = height - top - bottom;
  const x = (i) =>
    left +
    (xLabels.length === 1
      ? (w - left) / 2
      : (i * (w - left - 16)) / (xLabels.length - 1));
  const y = (v) => top + plot - (v / max) * plot;
  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        width="100%"
        style={{ maxWidth: w, display: "block" }}
        role="img"
        aria-label={title ?? "Trend across years"}
      >
        <title>{title ?? "Trend across years"}</title>
        <line
          x1={left}
          x2={w - 4}
          y1={top + plot}
          y2={top + plot}
          stroke="#c9cfc8"
        />
        <text
          x={left - 4}
          y={top + 4}
          textAnchor="end"
          fontSize="10"
          fill="#6b7469"
        >
          {fmt(max, 0)}
        </text>
        <text
          x={left - 4}
          y={top + plot}
          textAnchor="end"
          fontSize="10"
          fill="#6b7469"
        >
          0
        </text>
        {xLabels.map((label, i) => (
          <text
            key={label}
            x={x(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#333"
          >
            {label}
          </text>
        ))}
        {series.map((s, si) => {
          const colour = PALETTE[si % PALETTE.length];
          const points = s.values.map((v, i) =>
            v === null || v === undefined ? null : [x(i), y(v)],
          );
          const segments = [];
          let current = [];
          points.forEach((p) => {
            if (p) current.push(p);
            else if (current.length) {
              segments.push(current);
              current = [];
            }
          });
          if (current.length) segments.push(current);
          return (
            <g key={s.name}>
              {segments.map((seg, k) => (
                <polyline
                  key={k}
                  points={seg.map((p) => p.join(",")).join(" ")}
                  fill="none"
                  stroke={colour}
                  strokeWidth={s.highlight ? 3 : 2}
                />
              ))}
              {points.map((p, i) =>
                p ? (
                  <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={colour}>
                    <title>{`${s.name} ${xLabels[i]}: ${fmt(s.values[i])}`}</title>
                  </circle>
                ) : null,
              )}
            </g>
          );
        })}
      </svg>
      <div className="row small" style={{ gap: 12, flexWrap: "wrap" }}>
        {series.map((s, si) => (
          <span key={s.name} className="row" style={{ gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: PALETTE[si % PALETTE.length],
                display: "inline-block",
              }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// A bar chart of counts per item (recharts), with drawn axes, tick marks and axis titles.
//
// data:         [{ label, value, title? }]  title is shown in the tooltip (e.g. a full name)
// orientation:  "columns" — items along the X axis, values up the Y axis (default);
//               "rows"    — items down the Y axis, values along the X axis (for long lists)
// xLabel:       title under the bottom axis; yLabel: title beside the left axis
// valueLabel:   what the value counts, for the tooltip ("Centres")
// height:       a number of pixels, or "100%" to fill the parent (give the parent a height)
// colors:       one colour, or a list cycled over the bars
// ariaLabel:    a sentence describing the chart for screen readers

const AXIS = "var(--text-muted)";
const axisTitle = { fill: "var(--ink)", fontSize: 12, fontWeight: 600 };
const axisProps = {
  axisLine: { stroke: AXIS },
  tickLine: { stroke: AXIS },
};

function ChartTooltip({ active, payload, valueLabel }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <b>{row.label}</b>
      {row.title && <div className="muted small">{row.title}</div>}
      <div>
        {valueLabel}: <b>{row.value}</b>
      </div>
    </div>
  );
}

export function BarStatChart({
  data,
  orientation = "columns",
  valueLabel = "Value",
  colors = "var(--brand)",
  ariaLabel,
  xLabel,
  yLabel,
  height = 320,
}) {
  const palette = Array.isArray(colors) ? colors : [colors];
  const max = Math.max(1, ...data.map((d) => d.value));
  // A round top for the value axis, with headroom for the value labels: small counts step by 1,
  // larger ones by 5 (0, 5, 10 …).
  const top = max <= 5 ? max + 1 : Math.ceil((max * 1.1) / 5) * 5;
  const ticks = Array.from(
    { length: Math.floor(top / (top <= 6 ? 1 : 5)) + 1 },
    (_, i) => i * (top <= 6 ? 1 : 5),
  );
  const longest = Math.max(0, ...data.map((d) => String(d.label).length));
  const rows = orientation === "rows";
  // Long or many item labels under columns are slanted so they don't overlap.
  const slant = !rows && (longest > 9 || data.length > 6);

  const valueAxis = {
    type: "number",
    allowDecimals: false,
    domain: [0, top],
    ticks,
    tick: { fontSize: 11, fill: AXIS },
    ...axisProps,
  };
  const itemAxis = {
    type: "category",
    dataKey: "label",
    interval: 0,
    tick: rows
      ? { fontSize: 12, fill: "var(--ink)" }
      : {
          fontSize: 12,
          fill: "var(--ink)",
          ...(slant && { angle: -30, textAnchor: "end" }),
        },
    ...axisProps,
  };
  const titleX = xLabel && {
    value: xLabel,
    position: "insideBottom",
    offset: -14,
    style: axisTitle,
  };
  const titleY = yLabel && {
    value: yLabel,
    angle: -90,
    position: "insideLeft",
    offset: rows ? -12 : 4,
    style: { ...axisTitle, textAnchor: "middle" },
  };

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{ width: "100%", height, minHeight: 240 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={rows ? "vertical" : "horizontal"}
          margin={{
            top: 22,
            right: rows ? 36 : 16,
            bottom: xLabel ? 26 : 6,
            left: yLabel ? 18 : 4,
          }}
          barCategoryGap="28%"
        >
          <CartesianGrid
            vertical={rows}
            horizontal={!rows}
            stroke="var(--line)"
            strokeDasharray="3 3"
          />
          {rows ? (
            <>
              <XAxis {...valueAxis} label={titleX} />
              <YAxis
                {...itemAxis}
                width={Math.min(200, Math.max(56, longest * 7 + 14))}
                label={titleY}
              />
            </>
          ) : (
            <>
              <XAxis
                {...itemAxis}
                height={slant ? 30 + Math.min(longest, 18) * 4.5 : 30}
                label={titleX}
              />
              <YAxis {...valueAxis} width={44} label={titleY} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "var(--brand-50)" }}
            content={<ChartTooltip valueLabel={valueLabel} />}
          />
          <Bar
            dataKey="value"
            maxBarSize={64}
            radius={rows ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            isAnimationActive={false}
          >
            {data.map((d, i) => (
              <Cell key={d.label} fill={palette[i % palette.length]} />
            ))}
            <LabelList
              dataKey="value"
              position={rows ? "right" : "top"}
              style={{ fontSize: 12, fontWeight: 600, fill: "var(--ink)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

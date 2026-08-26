import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { OntimeStats } from '../types/api';

interface Props {
  data: OntimeStats[];
  height?: number;
}

type ChartPoint = Omit<OntimeStats, 'stats'> & { stats: number | null; na: number | null };

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDuration(seconds: number) {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds)}s`;
}

function getDotColor(value: number): string {
  if (value >= 100) return '#15803D';
  if (value >= 98) return '#22C55E';
  if (value >= 95) return '#F97316';
  return '#EF4444';
}

function renderDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  if (props.cx == null || props.cy == null || !props.payload || props.payload.stats == null) return null;
  return (
    <circle cx={props.cx} cy={props.cy} r={3} fill={getDotColor(props.payload.stats)} stroke="none" />
  );
}

function renderActiveDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  if (props.cx == null || props.cy == null || !props.payload || props.payload.stats == null) return null;
  return (
    <circle
      cx={props.cx}
      cy={props.cy}
      r={5}
      fill={getDotColor(props.payload.stats)}
      stroke="#020617"
      strokeWidth={2}
    />
  );
}

function renderNaDot(props: { cx?: number; cy?: number }) {
  if (props.cx == null || props.cy == null) return null;
  return (
    <circle cx={props.cx} cy={props.cy} r={3.5} fill="#0F172A" stroke="#94A3B8" strokeWidth={1.5} />
  );
}

function OntimeTooltip({
  active,
  label,
  data,
}: {
  active?: boolean;
  label?: string | number;
  data: OntimeStats[];
}) {
  if (!active || label == null) return null;
  const key = String(label).slice(0, 10);
  const p = data.find((d) => d.date.slice(0, 10) === key);
  if (!p) return null;
  return (
    <div
      style={{
        margin: 0,
        padding: '10px',
        background: '#1E293B',
        border: '1px solid #334155',
        borderRadius: '8px',
        fontSize: '13px',
        whiteSpace: 'nowrap',
      }}
    >
      <p style={{ margin: 0, color: '#F8FAFC' }}>{formatDate(p.date)}</p>
      {p.has_data === false ? (
        <p style={{ margin: '4px 0 0', color: '#94A3B8' }}>No data</p>
      ) : (
        <p style={{ margin: '4px 0 0' }}>
          <span style={{ color: getDotColor(Number(p.stats)) }}>{Number(p.stats).toFixed(1)}%</span>
          {p.unknown_seconds > 0 && (
            <span style={{ color: '#94A3B8' }}> · {fmtDuration(p.unknown_seconds)} unknown</span>
          )}
        </p>
      )}
    </div>
  );
}

export default function OntimeChart({ data, height = 200 }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-slate-500">
        No data available
      </div>
    );
  }

  // ponytail: has_data=false → stats null để line đứt khoảng (không vẽ uptime vô căn cứ).
  // `na` neo tooltip + chấm rỗng xám cho ngày không có dữ liệu (recharts v3 không bật
  // tooltip cho category có value null).
  const chartData = data.map((d) =>
    d.has_data === false ? { ...d, stats: null, na: 0 } : { ...d, na: null },
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#15803D" stopOpacity={0.2} />
            <stop offset="40%" stopColor="#22C55E" stopOpacity={0.15} />
            <stop offset="65%" stopColor="#F97316" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="main"
          domain={['dataMin', 100]}
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <YAxis yAxisId="na" hide domain={[0, 1]} />
        <Tooltip content={<OntimeTooltip data={data} />} cursor={{ stroke: '#475569', strokeDasharray: '3 3' }} />
        <Area
          yAxisId="main"
          type="monotone"
          dataKey="stats"
          fill="url(#areaGrad)"
          stroke="none"
        />
        <Line
          yAxisId="main"
          type="monotone"
          dataKey="stats"
          stroke="#475569"
          strokeWidth={2}
          connectNulls={false}
          dot={renderDot}
          activeDot={renderActiveDot}
        />
        <Line
          yAxisId="na"
          type="monotone"
          dataKey="na"
          stroke="transparent"
          isAnimationActive={false}
          dot={renderNaDot}
          activeDot={{ r: 5, fill: 'transparent', stroke: '#94A3B8' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

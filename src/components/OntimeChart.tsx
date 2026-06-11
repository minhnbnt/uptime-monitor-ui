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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDotColor(value: number): string {
  if (value >= 100) return '#15803D';
  if (value >= 98) return '#22C55E';
  if (value >= 95) return '#F97316';
  return '#EF4444';
}

function renderDot(props: { cx?: number; cy?: number; payload?: OntimeStats }) {
  if (props.cx == null || props.cy == null || !props.payload) return null;
  return (
    <circle cx={props.cx} cy={props.cy} r={3} fill={getDotColor(props.payload.stats)} stroke="none" />
  );
}

function renderActiveDot(props: { cx?: number; cy?: number; payload?: OntimeStats }) {
  if (props.cx == null || props.cy == null || !props.payload) return null;
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

export default function OntimeChart({ data, height = 200 }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-slate-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
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
          domain={[0, 100]}
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontSize: '13px',
          }}
          labelStyle={{ color: '#F8FAFC' }}
          formatter={(value) => {
            const v = Number(value);
            return [
              <span key="val" style={{ color: getDotColor(v) }}>
                {v.toFixed(1)}%
              </span>,
              'Uptime',
            ];
          }}
          labelFormatter={(label) => formatDate(String(label))}
        />
        <Area
          type="monotone"
          dataKey="stats"
          fill="url(#areaGrad)"
          stroke="none"
        />
        <Line
          type="monotone"
          dataKey="stats"
          stroke="#475569"
          strokeWidth={2}
          dot={renderDot}
          activeDot={renderActiveDot}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

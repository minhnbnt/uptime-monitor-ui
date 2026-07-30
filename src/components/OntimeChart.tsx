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
  timeScale?: boolean;
  step?: boolean;
  linear?: boolean;
}

function fmtDate(v: number | string): string {
  return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(v: number | string): string {
  return new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

export default function OntimeChart({ data, height = 200, timeScale, step, linear }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-slate-500">
        No data available
      </div>
    );
  }

  const chartData = (!timeScale ? data : data.map((d) => ({ ...d, date: new Date(d.date).getTime() }))) as Record<string, unknown>[];

  const isShort = chartData.length > 1
    && Number(chartData[chartData.length - 1].date) - Number(chartData[0].date) < 86400000;
  const fmt = isShort ? fmtTime : fmtDate;
  const lineType = step ? 'stepBefore' : linear ? 'linear' : 'monotone';

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
          scale={timeScale ? 'time' : 'auto'}
          domain={timeScale ? ['dataMin', 'dataMax'] : undefined}
          tickFormatter={(v) => fmt(v)}
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          type={timeScale ? 'number' : 'category'}
        />
        <YAxis
          domain={['dataMin', 100]}
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
          formatter={(value, _name, entry) => {
            const v = Number(value);
            const payload = entry?.payload as OntimeStats & { to?: string };
            const ts = Number(payload?.date);
            const label = payload?.to && Number.isFinite(ts)
              ? `${fmt(ts)} – ${fmt(new Date(payload.to).getTime())}`
              : null;
            const name = label ?? 'Uptime';
            return [
              <span key="val" style={{ color: getDotColor(v) }}>
                {v.toFixed(1)}%
              </span>,
              name,
            ];
          }}
          labelFormatter={(label) => {
            const ts = Number(label);
            return Number.isFinite(ts) ? fmt(ts) : String(label);
          }}
        />
        <Area
          type={lineType}
          dataKey="stats"
          fill="url(#areaGrad)"
          stroke="none"
        />
        <Line
          type={lineType}
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

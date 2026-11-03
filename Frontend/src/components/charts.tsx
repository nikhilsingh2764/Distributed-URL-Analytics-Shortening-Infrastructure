import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "../hooks/useChartColors";
import type { DailyPoint, LabelCount } from "../lib/types";
import { countryName, formatNumber, formatShortDate } from "../lib/utils";

export function ClicksChart({ data, height = 240, compact = false }: { data: DailyPoint[]; height?: number; compact?: boolean }) {
  const c = useChartColors();
  const gradientId = compact ? "fill-compact" : "fill-full";

  return (
    <div style={{ height }} role="img" aria-label={`Clicks per day, ${data.reduce((s, d) => s + d.clicks, 0)} in total`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: compact ? 4 : -16 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.primary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={c.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          {!compact && <CartesianGrid vertical={false} stroke={c.line} strokeDasharray="3 4" />}
          <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} minTickGap={28} tick={{ fill: c.muted, fontSize: 12 }} hide={compact} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} tick={{ fill: c.muted, fontSize: 12 }} hide={compact} />
          <Tooltip
            cursor={{ stroke: c.line }}
            contentStyle={{ background: c.surface, border: `1px solid ${c.line}`, borderRadius: 10, color: c.ink, fontSize: 13, boxShadow: "none" }}
            labelFormatter={(label) => formatShortDate(String(label))}
            formatter={(value) => [formatNumber(Number(value)), "Clicks"]}
          />
          <Area type="monotone" dataKey="clicks" stroke={c.primary} strokeWidth={2.25} fill={`url(#${gradientId})`} activeDot={{ r: 4, fill: c.primary, stroke: c.surface, strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ranked horizontal bars. Plain HTML so it stays readable and accessible without a chart library. */
export function BarList({ items, kind }: { items: LabelCount[]; kind?: "country" }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  const max = Math.max(1, ...items.map((i) => i.count));

  if (!items.length) return <p className="py-6 text-center text-sm text-muted">No data in this range.</p>;

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const label = kind === "country" ? countryName(item.label) : item.label;
        const pct = total ? Math.round((item.count / total) * 100) : 0;
        return (
          <li key={item.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{label}</span>
              <span className="shrink-0 tabular-nums text-muted">
                {formatNumber(item.count)} <span className="text-xs">· {pct}%</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

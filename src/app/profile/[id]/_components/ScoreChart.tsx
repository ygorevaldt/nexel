"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ScoreChartProps {
  history: Array<{ score: number; date: string }>;
}

function formatMonthYear(dateStr: string) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date);
}

function formatFullDate(dateStr: string) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

interface TooltipPayload {
  value: number;
  payload: { date: string };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{formatFullDate(entry.payload.date)}</p>
      <p className="font-bold text-primary">Score: {entry.value}/100</p>
    </div>
  );
}

export function ScoreChart({ history }: ScoreChartProps) {
  if (!history || history.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
        Ainda sem histórico suficiente
      </div>
    );
  }

  const data = history.map((entry) => ({
    score: entry.score,
    date: entry.date,
    label: formatMonthYear(entry.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#fbbf24"
          strokeWidth={2}
          dot={{ fill: "#fbbf24", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#fbbf24" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

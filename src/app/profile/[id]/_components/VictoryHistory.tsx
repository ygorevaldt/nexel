"use client";

import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy } from "lucide-react";

interface VictoryHistoryProps {
  victories: {
    total_matches: number;
    total_wins: number;
    total_losses: number;
    win_rate: number;
    by_month: Array<{
      year: number;
      month: number;
      matches: number;
      wins: number;
      losses: number;
    }>;
  };
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function VictoryHistory({ victories }: VictoryHistoryProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Compute available years from data + current year
  const availableYears = useMemo(() => {
    const yearsFromData = victories.by_month.map((e) => e.year);
    const allYears = Array.from(new Set([...yearsFromData, currentYear])).sort((a, b) => b - a);
    return allYears;
  }, [victories.by_month, currentYear]);

  // Filter data client-side
  const filtered = useMemo(() => {
    return victories.by_month.filter((e) => {
      const yearMatch = e.year === parseInt(selectedYear, 10);
      const monthMatch = selectedMonth === "all" || e.month === parseInt(selectedMonth, 10);
      return yearMatch && monthMatch;
    });
  }, [victories.by_month, selectedYear, selectedMonth]);

  const stats = useMemo(() => {
    return filtered.reduce(
      (acc, e) => ({
        matches: acc.matches + e.matches,
        wins: acc.wins + e.wins,
        losses: acc.losses + e.losses,
      }),
      { matches: 0, wins: 0, losses: 0 }
    );
  }, [filtered]);

  const winRate =
    stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={selectedYear} onValueChange={(v) => v && setSelectedYear(v)}>
          <SelectTrigger className="w-32 h-9 text-sm bg-muted/50 border-border/50 rounded-lg">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMonth} onValueChange={(v) => v && setSelectedMonth(v)}>
          <SelectTrigger className="w-44 h-9 text-sm bg-muted/50 border-border/50 rounded-lg">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats cards */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            Nenhuma partida registrada neste período.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Partidas", value: stats.matches, color: "" },
            { label: "Vitórias", value: stats.wins, color: "text-emerald-400" },
            { label: "Derrotas", value: stats.losses, color: "text-red-400" },
            {
              label: "Win Rate",
              value: `${winRate}%`,
              color: winRate >= 50 ? "text-emerald-400" : "text-amber-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="p-3 rounded-xl bg-muted/20 border border-border/30 text-center"
            >
              <div
                className={`text-2xl font-black tabular-nums ${color || "text-foreground"}`}
              >
                {value}
              </div>
              <div className="text-[10px] uppercase text-muted-foreground font-bold mt-0.5">
                {label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

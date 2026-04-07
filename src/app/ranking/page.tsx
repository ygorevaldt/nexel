"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Medal, Filter, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface RankingEntry {
  position: number;
  id: string;
  nickname: string;
  rank: string;
  globalScore: number;
  aiScore: number;
  winRate: number;
  wins: number;
  matches: number;
}

const RANKS = ["Todos", "Bronze", "Silver", "Gold", "Diamond", "Heroico", "Grão-Mestre"];

const POSITION_STYLES: Record<number, string> = {
  1: "text-yellow-400 font-black text-xl",
  2: "text-slate-300 font-black text-lg",
  3: "text-orange-400 font-black text-lg",
};

const POSITION_ICONS: Record<number, React.ElementType> = {
  1: Trophy,
  2: Medal,
  3: Award,
};

export default function RankingPage() {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState("Todos");
  const [sortBy, setSortBy] = useState("global_score");

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (rank && rank !== "Todos") params.set("rank", rank);
      params.set("sortBy", sortBy);
      params.set("limit", "30");

      const res = await fetch(`/api/ranking?${params.toString()}`);
      const json = await res.json();
      setEntries(json.data ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [rank, sortBy]);

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4 md:px-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-extrabold tracking-tight">Ranking Global</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Score = (AI Score × 60%) + (Win Rate × 40%) — sem apostas, só habilidade.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={rank} onValueChange={(v) => setRank(v ?? "Todos")}>
            <SelectTrigger id="ranking-rank-filter" className="w-40 h-9 rounded-lg bg-card/50 border-border/50">
              <SelectValue placeholder="Rank" />
            </SelectTrigger>
            <SelectContent>
              {RANKS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "global_score")}>
            <SelectTrigger id="ranking-sort-filter" className="w-40 h-9 rounded-lg bg-card/50 border-border/50">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global_score">Score Global</SelectItem>
              <SelectItem value="wins">Vitórias</SelectItem>
              <SelectItem value="headshot_rate">Headshot Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-2">
          {[entries[1], entries[0], entries[2]].map((entry, pIdx) => {
            const realPos = pIdx === 0 ? 2 : pIdx === 1 ? 1 : 3;
            const heights = ["h-24", "h-32", "h-20"];
            const Icon = POSITION_ICONS[realPos] ?? Trophy;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pIdx * 0.1 }}
                className={`${heights[pIdx]} flex flex-col items-center justify-end pb-3 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm relative overflow-hidden`}
              >
                <div className={`absolute top-3 ${POSITION_STYLES[realPos] ?? "text-muted-foreground font-bold"}`}>
                  <Icon className="h-5 w-5 mx-auto" />
                </div>
                <Avatar className="h-10 w-10 mb-1.5">
                  <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                    {entry.nickname.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs font-bold truncate max-w-[90%]">{entry.nickname}</p>
                <p className="text-[10px] text-muted-foreground">{entry.globalScore} pts</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      <Card className="border-border/30 bg-card/20 overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/30 py-3 px-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>Nenhum jogador no ranking ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {entries.map((entry, idx) => {
                const Icon = POSITION_ICONS[entry.position];
                const posStyle = POSITION_STYLES[entry.position] ?? "text-muted-foreground font-bold";

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors group"
                  >
                    <div className={`w-8 text-center shrink-0 ${posStyle}`}>
                      {Icon ? <Icon className="h-5 w-5 mx-auto" /> : entry.position}
                    </div>

                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                        {entry.nickname.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{entry.nickname}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold h-4">
                          {entry.rank}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{entry.wins}V • {entry.matches}P</span>
                      </div>
                    </div>

                    {/* AI Score */}
                    <div className="text-center hidden sm:block">
                      <div className="text-[10px] text-muted-foreground uppercase">AI Score</div>
                      <div className={`font-bold text-sm ${entry.aiScore >= 70 ? "text-emerald-400" : entry.aiScore >= 45 ? "text-amber-400" : "text-muted-foreground"}`}>
                        {entry.aiScore > 0 ? entry.aiScore : "—"}
                      </div>
                    </div>

                    {/* Win Rate */}
                    <div className="text-center hidden md:block">
                      <div className="text-[10px] text-muted-foreground uppercase">Win %</div>
                      <div className="font-bold text-sm">{entry.winRate}%</div>
                    </div>

                    {/* Global Score */}
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-muted-foreground uppercase">Score</div>
                      <div className="font-black text-base text-primary">{entry.globalScore}</div>
                    </div>

                    <Link
                      href={`/profile/${entry.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 px-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" })}
                    >
                      →
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

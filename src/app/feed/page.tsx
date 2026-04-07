"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trophy, ArrowUpRight, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface PlayerProfile {
  id: string;
  nickname: string;
  rank: string;
  score: number;
  matches: number;
  winRate: string;
  wins: number;
  highlight_video_url: string | null;
}

const RANKS = ["Todos", "Bronze", "Silver", "Gold", "Diamond", "Heroico", "Grão-Mestre"];
const SORT_OPTIONS = [
  { value: "global_score", label: "Score IA" },
  { value: "wins", label: "Vitórias" },
  { value: "headshot_rate", label: "Taxa Headshot" },
];

export default function FeedPage() {
  const [search, setSearch] = useState("");
  const [rank, setRank] = useState("Todos");
  const [minScore, setMinScore] = useState("");
  const [sortBy, setSortBy] = useState("global_score");
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (rank && rank !== "Todos") params.set("rank", rank);
      if (minScore) params.set("minScore", minScore);
      if (sortBy) params.set("sortBy", sortBy);

      const res = await fetch(`/api/feed?${params.toString()}`);
      const json = await res.json();
      setProfiles(json.data ?? []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [search, rank, minScore, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProfiles(), 300);
    return () => clearTimeout(timer);
  }, [fetchProfiles]);

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      Bronze: "text-orange-400 border-orange-400/30 bg-orange-400/10",
      Silver: "text-slate-400 border-slate-400/30 bg-slate-400/10",
      Gold: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
      Diamond: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
      Heroico: "text-purple-400 border-purple-400/30 bg-purple-400/10",
      "Grão-Mestre": "text-primary border-primary/30 bg-primary/10",
    };
    return colors[rank] ?? "text-muted-foreground border-border/30";
  };

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4 md:px-8 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Explorar Talentos</h1>
        <p className="text-muted-foreground text-sm">
          Descubra os próximos pro-players analisados por nossa IA.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="talent-search"
            placeholder="Buscar por Nick..."
            className="pl-10 h-10 rounded-lg bg-muted/50 border-border/50 focus:bg-background transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Rank Filter */}
        <Select value={rank} onValueChange={(v) => setRank(v ?? "Todos")}>
          <SelectTrigger id="rank-filter" className="w-full md:w-44 h-10 rounded-lg bg-muted/50 border-border/50">
            <SelectValue placeholder="Rank" />
          </SelectTrigger>
          <SelectContent>
            {RANKS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Min Score Filter */}
        <div className="relative w-full md:w-44">
          <Sliders className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="min-score-filter"
            type="number"
            min={0}
            max={100}
            placeholder="Score mín. (0-100)"
            className="pl-10 h-10 rounded-lg bg-muted/50 border-border/50"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
          />
        </div>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "global_score")}>
          <SelectTrigger id="sort-filter" className="w-full md:w-44 h-10 rounded-lg bg-muted/50 border-border/50">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid of Players */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {profiles.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              layout
            >
              <Card className="group relative overflow-hidden bg-card/40 border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 backdrop-blur-sm">

                {/* AI Score Badge */}
                <div className="absolute top-0 right-0 p-4">
                  <div className="flex flex-col items-end">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                      AI Score
                    </div>
                    <div className={`text-2xl font-black ${
                      player.score >= 70 ? "text-emerald-400" : player.score >= 45 ? "text-amber-400" : "text-primary"
                    } drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]`}>
                      {player.score > 0 ? player.score : "—"}
                    </div>
                  </div>
                </div>

                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-background group-hover:scale-105 transition-transform">
                    <AvatarFallback className="text-xl bg-linear-to-br from-primary/20 to-purple-500/20 text-primary font-bold">
                      {player.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg leading-none">{player.nickname}</h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-bold ${getRankColor(player.rank)}`}
                    >
                      {player.rank}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="grid grid-cols-3 gap-2 py-3 text-center border-y border-border/30 bg-muted/10">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-muted-foreground uppercase">Partidas</div>
                    <div className="font-bold text-sm">{player.matches}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-muted-foreground uppercase">Vitórias</div>
                    <div className="font-bold text-sm text-emerald-400">{player.wins}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-muted-foreground uppercase">Win Rate</div>
                    <div className="font-bold text-sm">{player.winRate}</div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                  <div className="flex gap-2 items-center">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Ativo</span>
                  </div>
                  <Link
                    href={`/profile/${player.id}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "h-8 px-3 rounded-full hover:bg-primary hover:text-white",
                    })}
                  >
                    Ver Perfil <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!loading && profiles.length === 0 && (
        <div className="py-20 text-center">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <h3 className="text-xl font-bold text-muted-foreground">Nenhum talento encontrado.</h3>
          <p className="text-muted-foreground">Tente outros filtros ou aguarde novos jogadores.</p>
        </div>
      )}
    </div>
  );
}

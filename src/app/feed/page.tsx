"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Trophy, ArrowUpRight, Sliders, Lock, Crown, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";

interface PlayerProfile {
  id: string;
  nickname: string;
  rank: string;
  score: number;
  matches: number;
  winRate: string;
  wins: number;
  highlight_video_url: string | null;
  favorites_count: number;
  is_favorited: boolean;
}

const RANKS = ["Todos", "Bronze", "Silver", "Gold", "Diamond", "Heroico", "Grão-Mestre"];
const SORT_OPTIONS = [
  { value: "global_score", label: "Score IA" },
  { value: "wins", label: "Vitórias" },
  { value: "headshot_rate", label: "Taxa Headshot" },
];

function getRankColor(rank: string) {
  const colors: Record<string, string> = {
    Bronze: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    Silver: "text-slate-400 border-slate-400/30 bg-slate-400/10",
    Gold: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    Diamond: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
    Heroico: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    "Grão-Mestre": "text-primary border-primary/30 bg-primary/10",
  };
  return colors[rank] ?? "text-muted-foreground border-border/30";
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [rank, setRank] = useState("Todos");
  const [minScore, setMinScore] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);

  const subscriptionStatus: string =
    (session?.user as { subscriptionStatus?: string })?.subscriptionStatus ?? "FREE";
  const isPro = subscriptionStatus === "PRO" || subscriptionStatus === "SCOUT";
  const isScout = subscriptionStatus === "SCOUT";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/feed");
    }
  }, [status, router]);

  const fetchProfiles = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (isScout && rank && rank !== "Todos") params.set("rank", rank);
      if (isScout && minScore) params.set("minScore", minScore);
      if (isScout && sortBy) params.set("sortBy", sortBy);
      if (favoritesOnly) params.set("favoritesOnly", "true");

      const res = await fetch(`/api/feed?${params.toString()}`);
      const json = await res.json();
      setProfiles(json.data ?? []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [search, rank, minScore, sortBy, favoritesOnly, status, isPro]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProfiles(), 300);
    return () => clearTimeout(timer);
  }, [fetchProfiles]);

  const handleToggleFavorite = async (profileId: string, currentlyFavorited: boolean) => {
    if (!session?.user?.id) return;
    setTogglingFavorite(profileId);
    try {
      const res = await fetch("/api/me/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao favoritar.");
        return;
      }

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? { ...p, is_favorited: json.favorited, favorites_count: json.favorites_count }
            : p
        )
      );

      if (favoritesOnly && !json.favorited) {
        setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      }

      toast.success(json.favorited ? "Adicionado aos favoritos!" : "Removido dos favoritos.");
    } catch {
      toast.error("Erro ao favoritar. Tente novamente.");
    } finally {
      setTogglingFavorite(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="container max-w-7xl mx-auto py-6 md:py-10 px-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="container max-w-7xl mx-auto py-6 md:py-10 px-4 md:px-8 space-y-6 md:space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Explorar Talentos</h1>
        <p className="text-muted-foreground text-sm">
          {isScout
            ? "Acesso completo: métricas, scores, estatísticas e filtros avançados de todos os jogadores."
            : isPro
            ? "Acesse scores e estatísticas completas de todos os jogadores. Assine o Plano SCOUT para desbloquear filtros avançados."
            : "Busque jogadores pelo nick. Assine o Plano PRO para ver scores, ranking e estatísticas completas."}
        </p>
        {!isPro ? (
          <Link
            href="/subscription"
            className={buttonVariants({ size: "sm", className: "rounded-full mt-1" })}
          >
            <Crown className="h-3.5 w-3.5 mr-1.5" /> Assinar PRO
          </Link>
        ) : !isScout ? (
          <Link
            href="/subscription"
            className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full mt-1" })}
          >
            <Crown className="h-3.5 w-3.5 mr-1.5" /> Assinar SCOUT para filtros avançados
          </Link>
        ) : null}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
        {/* Search — available to all */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por Nick..."
            className="pl-10 h-10 rounded-lg bg-muted/50 border-border/50 focus:bg-background transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Rank Filter — SCOUT only */}
        <div className={`relative ${!isScout ? "opacity-50 pointer-events-none" : ""}`}>
          {!isScout && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground z-10" />}
          <Select value={rank} onValueChange={(v) => setRank(v ?? "Todos")} disabled={!isScout}>
            <SelectTrigger className="w-full md:w-44 h-10 rounded-lg bg-muted/50 border-border/50">
              <SelectValue placeholder="Rank" />
            </SelectTrigger>
            <SelectContent>
              {RANKS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Min Score Filter — SCOUT only */}
        <div className={`relative w-full md:w-44 ${!isScout ? "opacity-50 pointer-events-none" : ""}`}>
          {!isScout
            ? <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            : <Sliders className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          }
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="Score mín. (0-100)"
            className="pl-10 h-10 rounded-lg bg-muted/50 border-border/50"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            disabled={!isScout}
          />
        </div>

        {/* Sort By — SCOUT only */}
        <div className={`relative ${!isScout ? "opacity-50 pointer-events-none" : ""}`}>
          {!isScout && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground z-10" />}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "")} disabled={!isScout}>
            <SelectTrigger className="w-full md:w-44 h-10 rounded-lg bg-muted/50 border-border/50">
              <span className={sortBy ? "" : "text-muted-foreground"}>
                {sortBy ? (SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? sortBy) : "Selecione"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Favorites filter — all logged-in users */}
        <Button
          variant={favoritesOnly ? "default" : "outline"}
          size="sm"
          className="h-10 rounded-lg shrink-0 gap-2"
          onClick={() => setFavoritesOnly((v) => !v)}
        >
          <Star className={`h-4 w-4 ${favoritesOnly ? "fill-current" : ""}`} />
          <span className="hidden sm:inline">Favoritos</span>
        </Button>
      </div>

      {/* Grid of Players */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

                {/* AI Score Badge — PRO/SCOUT only */}
                <div className="absolute top-0 right-0 p-4">
                  <div className="flex flex-col items-end">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                      AI Score
                    </div>
                    {isPro ? (
                      <div className={`text-2xl font-black ${
                        player.score >= 70 ? "text-emerald-400" : player.score >= 45 ? "text-amber-400" : "text-primary"
                      }`}>
                        {player.score > 0 ? player.score : "—"}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground/40">
                        <Lock className="h-3.5 w-3.5" />
                        <span className="text-sm font-bold">PRO</span>
                      </div>
                    )}
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
                    {isPro ? (
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold ${getRankColor(player.rank)}`}
                      >
                        {player.rank}
                      </Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50">
                        <Lock className="h-2.5 w-2.5" /> Rank (PRO)
                      </span>
                    )}
                    {/* Favorites count — visible to all */}
                    {player.favorites_count > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-yellow-400/80">
                        <Star className="h-2.5 w-2.5 fill-yellow-400/80" />
                        {player.favorites_count}
                      </div>
                    )}
                  </div>
                </CardHeader>

                {/* Stats — PRO/SCOUT only */}
                {isPro ? (
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
                ) : (
                  <CardContent className="py-3 text-center border-y border-border/30 bg-muted/10">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground/50 text-xs py-1">
                      <Lock className="h-3 w-3" />
                      <span>Estatísticas disponíveis no Plano PRO</span>
                    </div>
                  </CardContent>
                )}

                <CardFooter className="p-4 flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                  <button
                    onClick={() => handleToggleFavorite(player.id, player.is_favorited)}
                    disabled={togglingFavorite === player.id}
                    className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border transition-all font-medium ${
                      player.is_favorited
                        ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
                        : "border-border/40 text-muted-foreground hover:border-yellow-500/40 hover:text-yellow-400"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${player.is_favorited ? "fill-yellow-400" : ""}`} />
                    {player.is_favorited ? "Favoritado" : "Favoritar"}
                  </button>

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
        <div className="py-10 md:py-20 text-center">
          {favoritesOnly ? (
            <>
              <Star className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">Nenhum favorito ainda.</h3>
              <p className="text-muted-foreground">Favorite jogadores para vê-los aqui.</p>
            </>
          ) : (
            <>
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">Nenhum talento encontrado.</h3>
              <p className="text-muted-foreground">Tente outros filtros ou aguarde novos jogadores.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

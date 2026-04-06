"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, Trophy, ArrowUpRight } from "lucide-react";
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
  image: string;
}

export default function FeedPage() {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/feed?search=${encodeURIComponent(q)}` : '/api/feed';
      const res = await fetch(url);
      const json = await res.json();
      setProfiles(json.data ?? []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProfiles(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchProfiles]);

  return (
    <div className="container max-w-7xl py-10 px-4 md:px-8 space-y-8">

      {/* Search and Filter Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight">Explorar Talentos</h1>
          <p className="text-muted-foreground text-sm">Descubra os próximos pro-players analisados por nossa IA.</p>
        </div>

        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Nick..."
              className="pl-10 h-10 rounded-full bg-muted/50 border-border/50 focus:bg-background transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-2 border border-border/50 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Grid of Players */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {profiles.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              layout
            >
              <Card className="group relative overflow-hidden bg-card/40 border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 backdrop-blur-sm">

                {/* Visual Accent */}
                <div className="absolute top-0 right-0 p-4">
                   <div className="flex flex-col items-end">
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">AI Score</div>
                      <div className="text-2xl font-black text-primary drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]">
                        {player.score}
                      </div>
                   </div>
                </div>

                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-background group-hover:scale-105 transition-transform">
                    <AvatarFallback className="text-xl bg-linear-to-br from-primary/20 to-purple-500/20 text-primary">
                      {player.nickname.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg leading-none">{player.nickname}</h3>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold bg-muted/30">
                      {player.rank}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="grid grid-cols-2 gap-4 py-4 text-center border-y border-border/30 bg-muted/10">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase">Partidas</div>
                    <div className="font-bold text-sm">{player.matches}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase">Win Rate</div>
                    <div className="font-bold text-sm text-emerald-400">{player.winRate}</div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Ativo</span>
                  </div>
                  <Link
                    href={`/profile/${player.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm", className: "h-8 px-3 rounded-full hover:bg-primary hover:text-white" })}
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
           <p className="text-muted-foreground">Tente buscar por outro termo.</p>
        </div>
      )}

    </div>
  );
}

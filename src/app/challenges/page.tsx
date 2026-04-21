"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Swords, Users, AlertTriangle, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSentinel } from "@/hooks/useSentinel";

interface OpenChallenge {
  id: string;
  creator: string;
  type: string;
  matchType: string;
  difficulty: string;
  status: string;
  createdAt: string;
}

interface HistoryChallenge {
  _id: string;
  type: string;
  matchType: string;
  difficulty: string;
  status: string;
  createdAt: string;
  opponent_id?: string;
  winner_id?: string;
  creator_id?: string;
}

function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    BRONZE: "text-orange-400",
    SILVER: "text-slate-300",
    GOLD: "text-yellow-400",
    DIAMOND: "text-cyan-400",
  };
  return colors[difficulty] ?? "text-muted-foreground";
}

export default function ChallengesPage() {
  const [difficulty, setDifficulty] = useState<'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND'>('BRONZE');
  const [challengeType, setChallengeType] = useState<'1v1' | '4v4'>('1v1');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("matchmaking");

  const [openChallenges, setOpenChallenges] = useState<OpenChallenge[]>([]);
  const [openLoading, setOpenLoading] = useState(false);
  const [openLoadingMore, setOpenLoadingMore] = useState(false);
  const [openHasMore, setOpenHasMore] = useState(false);
  const [openPage, setOpenPage] = useState(1);

  const [history, setHistory] = useState<HistoryChallenge[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFetched, setHistoryFetched] = useState(false);

  const fetchOpen = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setOpenLoading(true);
    else setOpenLoadingMore(true);

    try {
      const res = await fetch(`/api/challenges?page=${pageNum}`);
      const json = await res.json();
      const incoming: OpenChallenge[] = json.data ?? [];
      setOpenHasMore(json.hasMore ?? false);
      setOpenChallenges((prev) => append ? [...prev, ...incoming] : incoming);
      setOpenPage(pageNum);
    } catch {
      if (!append) setOpenChallenges([]);
    } finally {
      setOpenLoading(false);
      setOpenLoadingMore(false);
    }
  }, []);

  const fetchHistory = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setHistoryLoading(true);
    else setHistoryLoadingMore(true);

    try {
      const res = await fetch(`/api/challenges?tab=history&page=${pageNum}`);
      const json = await res.json();
      const incoming: HistoryChallenge[] = json.data ?? [];
      setHistoryHasMore(json.hasMore ?? false);
      setHistory((prev) => append ? [...prev, ...incoming] : incoming);
      setHistoryPage(pageNum);
      setHistoryFetched(true);
    } catch {
      if (!append) setHistory([]);
    } finally {
      setHistoryLoading(false);
      setHistoryLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchOpen(1, false); }, [fetchOpen]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'history' && !historyFetched) {
      fetchHistory(1, false);
    }
  };

  const loadMoreOpen = useCallback(() => {
    if (!openLoadingMore && openHasMore) fetchOpen(openPage + 1, true);
  }, [openLoadingMore, openHasMore, openPage, fetchOpen]);

  const loadMoreHistory = useCallback(() => {
    if (!historyLoadingMore && historyHasMore) fetchHistory(historyPage + 1, true);
  }, [historyLoadingMore, historyHasMore, historyPage, fetchHistory]);

  const openSentinelRef = useSentinel(
    loadMoreOpen,
    activeTab === "matchmaking" && openHasMore && !openLoading && !openLoadingMore
  );
  const historySentinelRef = useSentinel(
    loadMoreHistory,
    activeTab === "history" && historyHasMore && !historyLoading && !historyLoadingMore
  );

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: challengeType, difficulty }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao criar desafio');
        return;
      }
      toast.success('Desafio criado com sucesso!');
      setDialogOpen(false);
      fetchOpen(1, false);
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch(`/api/challenges/${id}/accept`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao aceitar desafio');
        return;
      }
      toast.success('Desafio aceito!');
      fetchOpen(1, false);
    } catch {
      toast.error('Erro de conexão');
    }
  };

  return (
    <div className="container max-w-7xl py-10 px-4 md:px-8 space-y-8">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between bg-linear-to-br from-card to-background p-8 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Swords className="h-40 w-40" />
        </div>

        <div className="space-y-4 relative z-10">
          <Badge className="bg-primary/20 text-primary border-primary/30 py-1">Arena de Desafios</Badge>
          <h1 className="text-4xl font-extrabold tracking-tighter">Pronto para o <span className="text-primary italic">X1?</span></h1>
          <p className="text-muted-foreground max-w-lg">
            Desafie outros jogadores na arena Elite Hub. O vencedor leva o pote,
            e nossa IA garante que o resultado seja justo.
          </p>
          <div className="flex gap-4 pt-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger className={buttonVariants({ className: "h-11 px-8 rounded-full shadow-lg shadow-primary/20" })}>
                Criar Novo Desafio <Swords className="ml-2 h-4 w-4" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl w-full max-h-[88vh] overflow-y-auto bg-card border-border/60">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 pb-2">
                    <Zap className="h-5 w-5 text-primary" /> Configurar Desafio
                  </DialogTitle>
                  <DialogDescription>
                    O valor da aposta (Stake) será retido pela plataforma até o fim da partida.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-4">
                  <div className="space-y-3">
                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tipo de Jogo</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setChallengeType('1v1')}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left ${challengeType === '1v1'
                            ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                            : 'border-border/50 bg-muted/30 hover:border-border hover:bg-muted/60'
                          }`}
                      >
                        {challengeType === '1v1' && (
                          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px] shadow-primary" />
                        )}
                        <Swords className={`h-7 w-7 ${challengeType === '1v1' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="text-center">
                          <div className={`text-base font-black tracking-tight ${challengeType === '1v1' ? 'text-primary' : 'text-foreground'}`}>1 vs 1</div>
                          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">Duelo individual</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setChallengeType('4v4')}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left ${challengeType === '4v4'
                            ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                            : 'border-border/50 bg-muted/30 hover:border-border hover:bg-muted/60'
                          }`}
                      >
                        {challengeType === '4v4' && (
                          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px] shadow-primary" />
                        )}
                        <Users className={`h-7 w-7 ${challengeType === '4v4' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="text-center">
                          <div className={`text-base font-black tracking-tight ${challengeType === '4v4' ? 'text-primary' : 'text-foreground'}`}>4 vs 4</div>
                          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">Batalha de squads</div>
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dificuldade</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${difficulty === level
                              ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                              : 'border-border/50 bg-muted/30 hover:border-border hover:bg-muted/60'
                            }`}
                        >
                          {difficulty === level && (
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px] shadow-primary" />
                          )}
                          <div className={`text-base font-black tracking-tight ${getDifficultyColor(level)}`}>{level}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-full"
                    onClick={handleCreate}
                    disabled={submitting}
                  >
                    {submitting ? 'Publicando...' : 'Publicar Desafio'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="h-11 px-8 rounded-full">Como funciona?</Button>
          </div>
        </div>

        <div className="flex gap-4 md:flex-col lg:flex-row">
          <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 min-w-[140px] text-center">
            <div className="text-2xl font-black text-primary">{openChallenges.length}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Ativos hoje</div>
          </div>
          <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 min-w-[140px] text-center">
            <div className="text-2xl font-black">
              {openChallenges.filter((c) => c.matchType === 'RANKED').length}
            </div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Ranqueadas</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="matchmaking" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 h-12 bg-muted/40 p-1">
          <TabsTrigger value="matchmaking" className="h-full rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Abertos</TabsTrigger>
          <TabsTrigger value="history" className="h-full rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Seu Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="matchmaking" className="space-y-6">
          {openLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 rounded-xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : openChallenges.length === 0 ? (
            <div className="py-20 text-center">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">Nenhum desafio aberto no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openChallenges.map((challenge, idx) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                >
                  <Card className="hover:border-primary/50 transition-all group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs uppercase">
                          {challenge.creator.charAt(0)}
                        </div>
                        <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">{challenge.creator}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase">{challenge.type}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tighter">Dificuldade</span>
                          <div className={`text-2xl font-black ${getDifficultyColor(challenge.difficulty)}`}>{challenge.difficulty}</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                            <Badge variant="secondary" className="text-[9px] uppercase">{challenge.matchType}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg text-xs text-muted-foreground">
                        <Users className="h-3 w-3" /> Aguardando oponente
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        className="w-full bg-foreground text-background hover:bg-primary hover:text-white transition-all font-bold"
                        onClick={() => handleAccept(challenge.id)}
                      >
                        Aceitar Desafio
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div ref={openSentinelRef} className="h-4" />
          {openLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none bg-muted/20 backdrop-blur">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Modo</th>
                      <th className="text-left p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Dificuldade</th>
                      <th className="text-left p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Status</th>
                      <th className="text-right p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                        </td>
                      </tr>
                    ) : history.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum histórico encontrado</td>
                      </tr>
                    ) : history.map((h) => (
                      <tr key={h._id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-xs">{h.type} · {h.matchType}</td>
                        <td className={`p-4 font-bold text-sm ${getDifficultyColor(h.difficulty)}`}>{h.difficulty ?? '—'}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-[9px] uppercase font-black">{h.status}</Badge>
                        </td>
                        <td className="p-4 text-right text-muted-foreground text-xs">
                          {new Date(h.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div ref={historySentinelRef} className="h-4 mt-2" />
          {historyLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Alert Rule */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex gap-4">
        <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-500">Regras de Fair Play</h4>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Uso de macros, emuladores não autorizados ou qualquer auxílio externo resultará em <span className="font-bold">Banimento Permanente</span>.
            Nossa IA analisa o padrão de jogo de todas as partidas desafiadas para detectar fraudes.
          </p>
        </div>
      </div>

    </div>
  );
}

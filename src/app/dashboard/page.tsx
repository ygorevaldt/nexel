"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSentinel } from "@/hooks/useSentinel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BrainCircuit,
  Crosshair,
  Map,
  ShieldAlert,
  Activity,
  UploadCloud,
  Loader2,
  TrendingUp,
  Sparkles,
  Crown,
  Lock,
  Star,
  StarOff,
  Video,
  AlertCircle,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Zap,
  TrendingDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BooyahTab } from "./_components/BooyahTab";

const DAILY_PRO_LIMIT = 5;


interface AnalysisEntry {
  id: string;
  score: number;
  movement: number;
  gloo: number;
  rotation: number;
  playstyle: string;
  recruiter_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  mistakes: string[];
  highlights: string[];
  date: string;
  video_url: string | null;
  highlighted: boolean;
}

interface AnalysisData {
  overall_potential_score: number;
  movement_score: number;
  gloo_wall_usage: number;
  rotation_efficiency: number;
  recruiter_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  highlights: string[];
  recommended_playstyle: string;
}

interface BooyahVictory {
  match_type: 'SOLO' | 'SQUAD';
  game_mode: 'RANKED_SOLO' | 'RANKED_SQUAD';
  kills: number;
  date: string;
}

interface BooyahStats {
  total: number;
  solo: number;
  squad: number;
  total_kills: number;
  avg_kills: number;
}

interface ProfileState {
  globalScore: number;
  scoreHistory: { score: number; date: string }[];
  latestAnalysis: AnalysisData | null;
  subscriptionStatus: string;
  analyses: AnalysisEntry[];
  highlighted: string[];
  dailyUsed: number;
  dailyLimit: number;
  welcomeAnalysisCredits: number;
  welcomeBooyahCredits: number;
  booyahVictories: BooyahVictory[];
  booyahStats: BooyahStats;
  booyahDailyUsed: number;
  booyahDailyLimit: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pollingAnalysisId, setPollingAnalysisId] = useState<string | null>(null);
  const [analysesPage, setAnalysesPage] = useState(1);
  const [analysesHasMore, setAnalysesHasMore] = useState(false);
  const [loadingMoreAnalyses, setLoadingMoreAnalyses] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || "?";

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const [subRes, analysesRes, booyahRes, creditsRes] = await Promise.all([
        fetch("/api/subscription"),
        fetch("/api/me/analyses"),
        fetch("/api/me/booyah"),
        fetch("/api/me/credits"),
      ]);

      const sub = subRes.ok ? await subRes.json() : {};
      const analysesJson = analysesRes.ok ? await analysesRes.json() : {};
      const booyahJson = booyahRes.ok ? await booyahRes.json() : {};
      const creditsJson = creditsRes.ok ? await creditsRes.json() : {};

      setProfileData({
        subscriptionStatus: sub.subscriptionStatus ?? "FREE",
        globalScore: analysesJson.globalScore ?? 0,
        scoreHistory: (analysesJson.scoreHistory ?? []).map((e: { score: number; date: string }) => ({
          score: e.score,
          date: e.date,
        })),
        latestAnalysis: analysesJson.analyses?.[0]
          ? {
            overall_potential_score: analysesJson.analyses[0].score,
            movement_score: analysesJson.analyses[0].movement,
            gloo_wall_usage: analysesJson.analyses[0].gloo,
            rotation_efficiency: analysesJson.analyses[0].rotation,
            recruiter_feedback: analysesJson.analyses[0].recruiter_feedback ?? "",
            strengths: analysesJson.analyses[0].strengths ?? [],
            areas_for_improvement: analysesJson.analyses[0].areas_for_improvement ?? [],
            highlights: analysesJson.analyses[0].highlights ?? [],
            recommended_playstyle: analysesJson.analyses[0].playstyle,
          }
          : null,
        analyses: analysesJson.analyses ?? [],
        highlighted: analysesJson.highlighted ?? [],
        dailyUsed: analysesJson.dailyUsed ?? 0,
        dailyLimit: analysesJson.dailyLimit ?? DAILY_PRO_LIMIT,
        welcomeAnalysisCredits: creditsJson.data?.welcome_analysis_credits ?? 0,
        welcomeBooyahCredits: creditsJson.data?.welcome_booyah_credits ?? 0,
        booyahVictories: booyahJson.victories ?? [],
        booyahStats: booyahJson.stats ?? { total: 0, solo: 0, squad: 0, total_kills: 0, avg_kills: 0 },
        booyahDailyUsed: booyahJson.dailyUsed ?? 0,
        booyahDailyLimit: booyahJson.dailyLimit ?? 3,
      });
      setAnalysesHasMore(analysesJson.hasMore ?? false);
      setAnalysesPage(1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === "authenticated") fetchProfile();
  }, [status, fetchProfile]);

  const loadMoreAnalyses = useCallback(async () => {
    if (loadingMoreAnalyses || !analysesHasMore) return;
    setLoadingMoreAnalyses(true);
    try {
      const res = await fetch(`/api/me/analyses?page=${analysesPage + 1}`);
      if (!res.ok) return;
      const json = await res.json();
      const incoming: AnalysisEntry[] = json.analyses ?? [];
      setProfileData((prev) =>
        prev ? { ...prev, analyses: [...prev.analyses, ...incoming] } : prev
      );
      setAnalysesHasMore(json.hasMore ?? false);
      setAnalysesPage((p) => p + 1);
    } catch {
      // silent
    } finally {
      setLoadingMoreAnalyses(false);
    }
  }, [loadingMoreAnalyses, analysesHasMore, analysesPage]);

  const analysesSentinelRef = useSentinel(
    loadMoreAnalyses,
    analysesHasMore && !loading && !loadingMoreAnalyses
  );

  const handleYoutubeAnalysis = async () => {
    if (!youtubeUrl) {
      toast.error("Por favor, cole o link do vídeo do YouTube.");
      return;
    }

    const currentStatus = profileData?.subscriptionStatus ?? "FREE";
    const availableWelcomeCredits = profileData?.welcomeAnalysisCredits ?? 0;
    const userCanAnalyze = ["PRO", "SCOUT"].includes(currentStatus) || availableWelcomeCredits > 0;

    if (!userCanAnalyze) {
      toast.error("Seus créditos gratuitos acabaram. Assine o PRO para continuar.", {
        action: { label: "Assinar PRO", onClick: () => router.push("/subscription") },
      });
      return;
    }

    // Daily limit check
    const used = profileData?.dailyUsed ?? 0;
    const limit = profileData?.dailyLimit ?? DAILY_PRO_LIMIT;
    if (currentStatus === "PRO" && used >= limit) {
      toast.error(`Limite diário atingido (${limit} análises/dia).`, {
        description: "Compre créditos extras para continuar enviando hoje.",
        action: {
          label: "Comprar Créditos",
          onClick: () => toast.info("Em breve! Valor dos créditos a ser definido."),
        },
      });
      return;
    }

    setAnalyzing(true);
    setStatusMessage("Iniciando processamento...");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl })
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(json.error, {
            action: {
              label: "Comprar Créditos",
              onClick: () => toast.info("Em breve! Valor dos créditos a ser definido."),
            },
          });
        } else {
          toast.error(json.error ?? "Erro ao iniciar análise");
        }
        setAnalyzing(false);
        setStatusMessage("");
        return;
      }

      setPollingAnalysisId(json.analysisId);
      setStatusMessage("Analisando Partida... Isso pode levar até 1 minuto.");
      setYoutubeUrl(""); // Clear input
    } catch (err) {
      console.error("Analysis init error:", err);
      toast.error("Erro ao iniciar análise. Tente novamente.");
      setAnalyzing(false);
      setStatusMessage("");
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (pollingAnalysisId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/analyze/${pollingAnalysisId}/status`);
          if (res.ok) {
            const data = await res.json();

            if (data.status === "PROCESSING" || data.status === "PENDING") {
              const messages = [
                "Extraindo táticas da partida...",
                "Analisando movimentação e gelo...",
                "Avaliando uso de recursos...",
                "Gerando relatório de performance..."
              ];
              setStatusMessage(messages[Math.floor(Math.random() * messages.length)]);
            } else if (data.status === "COMPLETED") {
              clearInterval(interval);
              setPollingAnalysisId(null);
              setAnalyzing(false);
              setStatusMessage("");
              toast.success("Análise concluída! Seu Score foi atualizado.", {
                description: `Score potencial: ${data.data?.overall_potential_score ?? "—"}/100`,
                duration: 6000,
              });
              fetchProfile();
            } else if (data.status === "FAILED") {
              clearInterval(interval);
              setPollingAnalysisId(null);
              setAnalyzing(false);
              setStatusMessage("");
              toast.error(`Falha na análise: ${data.errorMessage}`);
            }
          }
        } catch (error) {
          console.error("Error polling status:", error);
        }
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [pollingAnalysisId, fetchProfile]);

  const toggleHighlight = async (analysisId: string) => {
    setTogglingId(analysisId);
    try {
      const isCurrentlyHighlighted = profileData?.highlighted.includes(analysisId);
      const currentCount = profileData?.highlighted.length ?? 0;

      if (!isCurrentlyHighlighted && currentCount >= 5) {
        toast.error("Você pode destacar no máximo 5 gameplays.");
        return;
      }

      const res = await fetch("/api/me/analyses/highlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao atualizar destaque.");
        return;
      }

      setProfileData((prev) =>
        prev
          ? {
            ...prev,
            highlighted: json.highlightedIds,
            analyses: prev.analyses.map((a) => ({
              ...a,
              highlighted: json.highlightedIds.includes(a.id),
            })),
          }
          : prev
      );

      toast.success(json.highlighted ? "Gameplay destacada para Scouts!" : "Destaque removido.");
    } catch {
      toast.error("Erro ao atualizar destaque.");
    } finally {
      setTogglingId(null);
    }
  };

  const subscriptionStatus = profileData?.subscriptionStatus ?? "FREE";
  const isPro = ["PRO", "SCOUT"].includes(subscriptionStatus);
  const isScout = subscriptionStatus === "SCOUT";
  const welcomeAnalysisCredits = profileData?.welcomeAnalysisCredits ?? 0;
  const hasAnalyses = (profileData?.analyses?.length ?? 0) > 0;
  const canUseAnalysis = isPro || welcomeAnalysisCredits > 0 || hasAnalyses;
  const welcomeBooyahCredits = profileData?.welcomeBooyahCredits ?? 0;
  const hasBooyahs = (profileData?.booyahVictories?.length ?? 0) > 0;
  const canUseBooyah = isPro || welcomeBooyahCredits > 0 || hasBooyahs;
  const globalScore = profileData?.globalScore ?? 0;
  const dailyUsed = profileData?.dailyUsed ?? 0;
  const dailyLimit = profileData?.dailyLimit ?? DAILY_PRO_LIMIT;
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);
  const analysis = profileData?.latestAnalysis;
  const scoreColor =
    globalScore >= 75 ? "text-emerald-400" : globalScore >= 50 ? "text-amber-400" : "text-red-400";

  if (status === "loading" || loading) {
    return (
      <div className="container max-w-7xl mx-auto py-6 md:py-10 px-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 md:py-10 px-4 md:px-8 space-y-6 md:space-y-8">

      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-center justify-between bg-card p-4 md:p-8 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 ring-4 ring-primary/20">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">{session?.user?.name || "—"}</h1>
            <div className="text-sm text-muted-foreground">
              {(session?.user as { freefire_id?: string })?.freefire_id
                ? `ID: ${(session?.user as { freefire_id?: string }).freefire_id}`
                : "ID Free Fire não informado"}
            </div>
            <div className="inline-flex items-center rounded-sm bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {subscriptionStatus}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3">
          <div className="p-4 rounded-xl bg-muted/30 border border-border text-right">
            <span className="text-sm text-muted-foreground font-medium block mb-1">Score Global</span>
            <div className="flex items-baseline gap-2 justify-end">
              <span className={`text-5xl font-black ${globalScore > 0 ? scoreColor : "text-muted-foreground/30"}`}>
                {globalScore > 0 ? globalScore : "—"}
              </span>
              {globalScore > 0 && <span className="text-sm text-muted-foreground">/100</span>}
            </div>
          </div>

          {/* Daily limit indicator (PRO only) */}
          {isPro && !isScout && (
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${dailyRemaining === 0
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : dailyRemaining <= 2
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-muted/30 border-border text-muted-foreground"
              }`}>
              {dailyRemaining === 0
                ? <AlertCircle className="h-3.5 w-3.5" />
                : <UploadCloud className="h-3.5 w-3.5" />}
              <span>
                {dailyRemaining === 0
                  ? "Limite diário atingido"
                  : `${dailyRemaining} de ${dailyLimit} análises hoje`}
              </span>
              {dailyRemaining === 0 && (
                <button
                  onClick={() => toast.info("Em breve! Valor dos créditos a ser definido.")}
                  className="ml-1 flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <CreditCard className="h-3 w-3" /> Créditos
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-5 md:mb-8 h-12">
          <TabsTrigger value="overview" className="h-full rounded-lg">Visão Geral</TabsTrigger>
          <TabsTrigger value="gallery" className="h-full rounded-lg">Gameplays</TabsTrigger>
          <TabsTrigger value="booyah" className="h-full rounded-lg">Booyah 🏆</TabsTrigger>
          <TabsTrigger value="history" className="h-full rounded-lg">Evolução</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          <div className={!canUseAnalysis ? "relative" : ""}>
            {!canUseAnalysis && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-10 bg-background/50 backdrop-blur-[2px] rounded-xl">
                <div className="text-center space-y-4 p-6 max-w-sm mx-auto">
                  <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight">Desbloqueie o Coach IA</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Envie gameplays e receba análise detalhada do <strong className="text-foreground">Coach IA</strong>.
                    Descubra seu score de movimentação, gelo, rotação e potencial geral.
                  </p>
                  <Link href="/subscription" className={buttonVariants({ className: "rounded-full px-8 w-full" })}>
                    <Crown className="h-4 w-4 mr-2" /> Assinar PRO
                  </Link>
                </div>
              </div>
            )}
            <div className={!canUseAnalysis ? "blur-sm pointer-events-none select-none space-y-4 md:space-y-6" : "space-y-4 md:space-y-6"}>

              <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Movimentação", icon: Activity, value: analysis?.movement_score },
                  { label: "Uso de Gelo", icon: ShieldAlert, value: analysis?.gloo_wall_usage },
                  { label: "Rotação", icon: Map, value: analysis?.rotation_efficiency },
                  { label: "Potencial Geral", icon: Crosshair, value: analysis?.overall_potential_score },
                ].map(({ label, icon: Icon, value }) => (
                  <Card key={label} className="bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{label}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${value !== undefined ? (value >= 70 ? "text-emerald-400" : value >= 45 ? "text-amber-400" : "text-red-400") : "text-muted-foreground/30"}`}>
                        {value !== undefined ? value : "—"}
                      </div>
                      <div className="h-1.5 w-full mt-3 rounded-full bg-muted overflow-hidden">
                        {value !== undefined && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${value >= 70 ? "bg-emerald-500" : value >= 45 ? "bg-amber-500" : "bg-red-500"}`}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                {/* Recruiter Feedback Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="h-5 w-5 text-primary" />
                      Feedback de Performance
                    </CardTitle>
                    <CardDescription>
                      {analysis ? "Análise do seu último clipe enviado" : "Baseado nas suas análises enviadas"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence mode="wait">
                      {analysis?.recruiter_feedback ? (
                        <motion.div
                          key="feedback"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <p className="text-sm text-muted-foreground leading-relaxed italic">
                            &quot;{analysis.recruiter_feedback.substring(0, 300)}...&quot;
                          </p>
                          {analysis.recommended_playstyle && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
                              <span className="text-sm font-medium">
                                Estilo recomendado: <span className="text-blue-400">{analysis.recommended_playstyle}</span>
                              </span>
                            </div>
                          )}
                          {profileData?.analyses[0] && (
                            <button
                              onClick={() => { setActiveTab("gallery"); setOpenDialogId(profileData.analyses[0].id); }}
                              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ChevronRight className="h-3.5 w-3.5" /> Ver detalhes completos
                            </button>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty"
                          className="flex flex-col items-center justify-center py-8 text-center gap-3"
                        >
                          <BrainCircuit className="h-10 w-10 text-muted-foreground/20" />
                          <p className="text-sm text-muted-foreground">
                            Nenhuma análise realizada ainda.<br />Envie um clipe para receber Feedback da IA.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Upload Card */}
                <Card className="flex flex-col items-center justify-center text-center p-6 border-dashed border-2 hover:border-primary/50 transition-colors">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4">
                    {analyzing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-8 w-8" />
                      </motion.div>
                    ) : (
                      <Video className="h-8 w-8" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    {analyzing ? "Processando..." : "Nova Análise por YouTube"}
                  </h3>
                  {analyzing && statusMessage && (
                    <p className="text-sm font-medium text-primary mb-4 animate-pulse">{statusMessage}</p>
                  )}
                  {!analyzing && (
                    <>
                      <p className="text-sm text-muted-foreground mb-4 max-w-[16rem]">
                        Cole o link de uma partida no YouTube (até 10 min) para receber um raio-x completo do Coach IA.
                      </p>

                      {!isScout && (
                        <p className={`text-xs mb-4 font-medium ${(!isPro && welcomeAnalysisCredits === 0) || (isPro && dailyRemaining === 0)
                          ? "text-red-400"
                          : "text-muted-foreground/70"
                          }`}>
                          {isPro
                            ? dailyRemaining === 0
                              ? "Limite diário atingido — compre créditos para continuar"
                              : `${dailyRemaining} análise${dailyRemaining !== 1 ? "s" : ""} restante${dailyRemaining !== 1 ? "s" : ""} hoje`
                            : welcomeAnalysisCredits === 0
                              ? "Créditos gratuitos esgotados"
                              : `${welcomeAnalysisCredits} crédito${welcomeAnalysisCredits !== 1 ? "s" : ""} gratuito${welcomeAnalysisCredits !== 1 ? "s" : ""} disponível${welcomeAnalysisCredits !== 1 ? "is" : ""}`}
                        </p>
                      )}

                      <div className="flex w-full max-w-sm flex-col gap-2">
                        <input
                          type="url"
                          placeholder="https://youtu.be/..."
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={(!isScout && ((isPro && dailyRemaining === 0) || (!isPro && welcomeAnalysisCredits === 0)))}
                        />
                        <button
                          onClick={handleYoutubeAnalysis}
                          disabled={!youtubeUrl || (!isScout && ((isPro && dailyRemaining === 0) || (!isPro && welcomeAnalysisCredits === 0)))}
                          className={`cursor-pointer w-full inline-flex justify-center items-center px-4 py-2 h-10 rounded-md font-medium transition-colors text-sm ${(!youtubeUrl || (!isScout && ((isPro && dailyRemaining === 0) || (!isPro && welcomeAnalysisCredits === 0))))
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                            }`}
                        >
                          Analisar Gameplay
                        </button>
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── Gallery Tab ─── */}
        <TabsContent value="gallery" className="space-y-4 md:space-y-6">
          <div className={!canUseAnalysis ? "relative" : ""}>
            {!canUseAnalysis && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-10 bg-background/50 backdrop-blur-[2px] rounded-xl">
                <div className="text-center space-y-4 p-6 max-w-sm mx-auto">
                  <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight">Desbloqueie o Coach IA</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Envie gameplays e receba análise detalhada do <strong className="text-foreground">Coach IA</strong>.
                    Descubra seu score de movimentação, gelo, rotação e potencial geral.
                  </p>
                  <Link href="/subscription" className={buttonVariants({ className: "rounded-full px-8 w-full" })}>
                    <Crown className="h-4 w-4 mr-2" /> Assinar PRO
                  </Link>
                </div>
              </div>
            )}
            <div className={!canUseAnalysis ? "blur-sm pointer-events-none select-none space-y-4 md:space-y-6" : "space-y-4 md:space-y-6"}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Minhas Gameplays</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Você pode destacar até <strong>5 gameplays</strong> para que Scouts vejam em destaque no seu perfil.
                    <span className="ml-1 text-primary font-medium">
                      ({profileData?.highlighted.length ?? 0}/5 destacadas)
                    </span>
                  </p>
                </div>
              </div>

              {(profileData?.analyses.length ?? 0) === 0 ? (
                <div className="py-10 md:py-20 text-center">
                  <Video className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                  <h3 className="text-xl font-bold text-muted-foreground">Nenhuma gameplay enviada ainda.</h3>
                  <p className="text-sm text-muted-foreground">Envie um clipe na aba Visão Geral para começar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {profileData?.analyses.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className={`relative border transition-all ${item.highlighted
                        ? "border-primary/60 shadow-lg shadow-primary/10 bg-primary/5"
                        : "border-border/50 bg-card/40"
                        }`}>
                        {item.highlighted && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                              <Star className="h-2.5 w-2.5 mr-1 fill-primary" /> Destaque
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="pb-2 pt-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">
                                Score:{" "}
                                <span className={`${item.score >= 70 ? "text-emerald-400" : item.score >= 45 ? "text-amber-400" : "text-red-400"}`}>
                                  {item.score}/100
                                </span>
                              </CardTitle>
                              <CardDescription className="text-xs mt-0.5">
                                {new Intl.DateTimeFormat("pt-BR", {
                                  day: "2-digit", month: "short", year: "numeric"
                                }).format(new Date(item.date))}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-muted-foreground">
                            <div>
                              <div className="font-bold text-foreground text-sm">{item.movement}</div>
                              Mov.
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-sm">{item.gloo}</div>
                              Gelo
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-sm">{item.rotation}</div>
                              Rot.
                            </div>
                          </div>
                          {item.playstyle && (
                            <div className="text-[10px] text-primary bg-primary/10 rounded px-2 py-1 text-center font-medium">
                              {item.playstyle}
                            </div>
                          )}
                          <Dialog open={openDialogId === item.id} onOpenChange={(open) => { if (!open) setOpenDialogId(null); }}>
                            <DialogTrigger onClick={() => setOpenDialogId(item.id)} className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all font-medium">
                              <ChevronRight className="h-3.5 w-3.5" /> Ver detalhes
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-3xl w-full max-h-[88vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <BrainCircuit className="h-5 w-5 text-primary" />
                                  Detalhes da Análise
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-5 mt-2">
                                {/* Scores */}
                                <div className="grid grid-cols-4 gap-3 text-center">
                                  {[
                                    { label: "Potencial", value: item.score },
                                    { label: "Movimentação", value: item.movement },
                                    { label: "Gelo", value: item.gloo },
                                    { label: "Rotação", value: item.rotation },
                                  ].map(({ label, value }) => (
                                    <div key={label} className="rounded-xl bg-muted/30 p-3 border border-border/30">
                                      <div className={`text-2xl font-black ${value >= 70 ? "text-emerald-400" : value >= 45 ? "text-amber-400" : "text-red-400"}`}>{value}</div>
                                      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                                    </div>
                                  ))}
                                </div>

                                {item.playstyle && (
                                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
                                    <span className="text-sm font-medium">Estilo recomendado: <span className="text-blue-400">{item.playstyle}</span></span>
                                  </div>
                                )}

                                {item.recruiter_feedback && (
                                  <div className="rounded-lg bg-muted/20 p-4 border border-border/50">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Feedback da IA</p>
                                    <p className="text-sm leading-relaxed italic">&quot;{item.recruiter_feedback}&quot;</p>
                                  </div>
                                )}

                                {/* Two-column grid for lists */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {item.highlights.length > 0 && (
                                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mb-2"><Zap className="h-3.5 w-3.5" /> Momentos de destaque</p>
                                      <ul className="space-y-1.5">
                                        {item.highlights.map((h, i) => (
                                          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                            {h}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {item.strengths.length > 0 && (
                                    <div className="rounded-lg bg-sky-500/5 border border-sky-500/20 p-3">
                                      <p className="text-xs font-semibold text-sky-400 flex items-center gap-1 mb-2"><Star className="h-3.5 w-3.5" /> Pontos fortes</p>
                                      <ul className="space-y-1.5">
                                        {item.strengths.map((s, i) => (
                                          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                                            {s}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {item.areas_for_improvement.length > 0 && (
                                    <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
                                      <p className="text-xs font-semibold text-amber-400 flex items-center gap-1 mb-2"><TrendingUp className="h-3.5 w-3.5" /> Pontos a melhorar</p>
                                      <ul className="space-y-1.5">
                                        {item.areas_for_improvement.map((a, i) => (
                                          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                            {a}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {item.mistakes.length > 0 && (
                                    <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                                      <p className="text-xs font-semibold text-red-400 flex items-center gap-1 mb-2"><TrendingDown className="h-3.5 w-3.5" /> Erros identificados</p>
                                      <ul className="space-y-1.5">
                                        {item.mistakes.map((m, i) => (
                                          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                            <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                            {m}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <button
                            onClick={() => toggleHighlight(item.id)}
                            disabled={togglingId === item.id}
                            className={`w-full flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border transition-all font-medium ${item.highlighted
                              ? "border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
                              : (profileData?.highlighted.length ?? 0) >= 5
                                ? "border-border/30 text-muted-foreground/50 cursor-not-allowed"
                                : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary"
                              }`}
                          >
                            {item.highlighted ? (
                              <><StarOff className="h-3.5 w-3.5" /> Remover destaque</>
                            ) : (
                              <><Star className="h-3.5 w-3.5" /> Destacar para Scouts</>
                            )}
                          </button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div ref={analysesSentinelRef} className="h-4" />
          {loadingMoreAnalyses && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </TabsContent>

        {/* ─── Evolution Tab ─── */}
        <TabsContent value="history">
          <div className={!canUseAnalysis ? "relative" : ""}>
            {!canUseAnalysis && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-10 bg-background/50 backdrop-blur-[2px] rounded-xl">
                <div className="text-center space-y-4 p-6 max-w-sm mx-auto">
                  <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight">Desbloqueie o Coach IA</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Envie gameplays e receba análise detalhada do <strong className="text-foreground">Coach IA</strong>.
                    Descubra seu score de movimentação, gelo, rotação e potencial geral.
                  </p>
                  <Link href="/subscription" className={buttonVariants({ className: "rounded-full px-8 w-full" })}>
                    <Crown className="h-4 w-4 mr-2" /> Assinar PRO
                  </Link>
                </div>
              </div>
            )}
            <div className={!canUseAnalysis ? "blur-sm pointer-events-none select-none" : ""}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Evolução do Score de IA
                  </CardTitle>
                  <CardDescription>
                    Seu histórico de score calculado a cada análise realizada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(profileData?.scoreHistory.length ?? 0) > 0 ? (
                    <div className="space-y-3">
                      <div className="h-40 flex gap-1.5 px-2">
                        {profileData?.scoreHistory.map((entry, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-card border border-border text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {entry.score}/100
                            </div>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${entry.score}%` }}
                              transition={{ duration: 0.5, delay: i * 0.05 }}
                              className={`w-full rounded-t-sm ${entry.score >= 70 ? "bg-emerald-500/70" : entry.score >= 45 ? "bg-amber-500/70" : "bg-red-500/70"
                                }`}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground px-2">
                        <span>Primeira análise</span>
                        <span>Mais recente</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                      <div className="text-center">
                        <TrendingUp className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        <p>Seu gráfico de evolução aparecerá após a primeira análise</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Booyah Tab ─── */}
        <TabsContent value="booyah">
          <div className={!canUseBooyah ? "relative" : ""}>
            {!canUseBooyah && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-10 bg-background/50 backdrop-blur-[2px] rounded-xl">
                <div className="text-center space-y-4 p-6 max-w-sm mx-auto">
                  <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight">Desbloqueie o Coach IA</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Envie gameplays e receba análise detalhada do <strong className="text-foreground">Coach IA</strong>.
                    Descubra seu score de movimentação, gelo, rotação e potencial geral.
                  </p>
                  <Link href="/subscription" className={buttonVariants({ className: "rounded-full px-8 w-full" })}>
                    <Crown className="h-4 w-4 mr-2" /> Assinar PRO
                  </Link>
                </div>
              </div>
            )}
            <div className={!canUseBooyah ? "blur-sm pointer-events-none select-none" : ""}>
              <BooyahTab
                victories={profileData?.booyahVictories ?? []}
                stats={profileData?.booyahStats ?? { total: 0, solo: 0, squad: 0, total_kills: 0, avg_kills: 0 }}
                dailyUsed={profileData?.booyahDailyUsed ?? 0}
                dailyLimit={profileData?.booyahDailyLimit ?? 3}
                subscriptionStatus={subscriptionStatus}
                welcomeBooyahCredits={profileData?.welcomeBooyahCredits ?? 0}
                onVictoryRecorded={fetchProfile}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

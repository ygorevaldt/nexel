"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BrainCircuit,
  Crosshair,
  Map,
  ShieldAlert,
  Activity,
  UploadCloud,
  TrendingUp,
  Sparkles,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface AiScoreEntry {
  score: number;
  date: string;
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

interface ProfileData {
  profileId: string;
  globalScore: number;
  scoreHistory: AiScoreEntry[];
  latestAnalysis: AnalysisData | null;
  subscriptionStatus: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || "?";

  // Fetch profile data (score history + latest analysis)
  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      // Profile is fetched via the profile API by user — for now we get it from the feed search
      // This would ideally be /api/me/profile
      const res = await fetch(`/api/subscription`);
      if (!res.ok) return;
      const json = await res.json();
      setProfileData((prev) => ({
        ...(prev ?? { profileId: "", globalScore: 0, scoreHistory: [], latestAnalysis: null }),
        subscriptionStatus: json.subscriptionStatus,
      }));
    } catch {
      // silent
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Por favor, selecione um arquivo de vídeo.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Vídeo muito grande. Máximo 100MB.");
      return;
    }

    // Check subscription
    const currentStatus = profileData?.subscriptionStatus ?? "FREE";
    if (currentStatus === "FREE") {
      toast.error("Análise de IA requer o Plano Pro.", {
        action: {
          label: "Assinar Pro",
          onClick: () => window.location.href = "/subscription",
        },
      });
      return;
    }

    setUploading(true);
    toast.info("Extraindo frames do vídeo...");

    try {
      // Dynamic import to avoid SSR issues with FFmpeg.wasm
      const { extractFrames } = await import("@/lib/video-processor");
      const frameUrls = await extractFrames(file, 3);

      if (frameUrls.length === 0) {
        toast.error("Não foi possível extrair frames do vídeo.");
        return;
      }

      setUploading(false);
      setAnalyzing(true);
      toast.info(`${frameUrls.length} frames extraídos. Enviando para análise da IA...`);

      // Convert blob URLs to base64
      const framesBase64: string[] = await Promise.all(
        frameUrls.map(async (url) => {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        })
      );

      // Cleanup blob URLs
      frameUrls.forEach((url) => URL.revokeObjectURL(url));

      // Build FormData and send to /api/analyze
      const formData = new FormData();
      framesBase64.forEach((frame) => formData.append("frames", frame));
      
      // We need profile_id — get it from session user (would need to be stored)
      // For now we pass user ID as a fallback; the profile must exist
      formData.append("profile_id", (session?.user as { profileId?: string })?.profileId ?? session?.user?.id ?? "");

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Erro na análise");
        return;
      }

      toast.success("Análise concluída! Seu Score foi atualizado.", {
        description: `Score potencial: ${json.data?.analysis_data?.overall_potential_score ?? "—"}/100`,
        duration: 6000,
      });

      setProfileData((prev) => ({
        ...(prev ?? { profileId: "", globalScore: 0, scoreHistory: [], subscriptionStatus: "FREE" }),
        globalScore: json.data?.analysis_data?.overall_potential_score ?? prev?.globalScore ?? 0,
        latestAnalysis: json.data?.analysis_data ?? null,
        scoreHistory: [
          ...(prev?.scoreHistory ?? []),
          { score: json.data?.analysis_data?.overall_potential_score ?? 0, date: new Date().toISOString() },
        ],
      }));
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Erro ao processar vídeo. Tente novamente.");
    } finally {
      setUploading(false);
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const analysis = profileData?.latestAnalysis;
  const globalScore = profileData?.globalScore ?? 0;
  const isPro = ["PRO", "SCOUT"].includes(profileData?.subscriptionStatus ?? "FREE");

  const scoreColor = globalScore >= 75 ? "text-emerald-400" : globalScore >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4 md:px-8 space-y-8">

      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm">
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
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-sm bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {profileData?.subscriptionStatus ?? "FREE"}
              </div>
              {!isPro && (
                <Link
                  href="/subscription"
                  className={buttonVariants({ size: "sm", className: "h-7 text-xs rounded-full" })}
                >
                  <Crown className="h-3 w-3 mr-1" /> Assinar Pro
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end p-4 rounded-xl bg-muted/30 border border-border">
          <span className="text-sm text-muted-foreground font-medium mb-1">Score Global</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-black ${globalScore > 0 ? scoreColor : "text-muted-foreground/30"}`}>
              {globalScore > 0 ? globalScore : "—"}
            </span>
            {globalScore > 0 && <span className="text-sm text-muted-foreground">/100</span>}
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {globalScore > 0 ? "Calculado pela IA" : "Realize análises para calcular"}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 h-12">
          <TabsTrigger value="overview" className="h-full rounded-lg">Visão Geral (IA)</TabsTrigger>
          <TabsTrigger value="history" className="h-full rounded-lg">Evolução</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview" className="space-y-6">

          {/* Metric Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

          <div className="grid gap-6 md:grid-cols-2">
            {/* Recruiter Feedback Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  Feedback do Recrutador de Elite
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
                        "{analysis.recruiter_feedback.substring(0, 300)}..."
                      </p>
                      {analysis.recommended_playstyle && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <Sparkles className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium">
                            Estilo recomendado: <span className="text-primary">{analysis.recommended_playstyle}</span>
                          </span>
                        </div>
                      )}
                      {analysis.strengths.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase text-emerald-400 mb-2">Pontos Fortes</p>
                          <ul className="space-y-1">
                            {analysis.strengths.map((s, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.areas_for_improvement.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase text-amber-400 mb-2">Pontos a Melhorar</p>
                          <ul className="space-y-1">
                            {analysis.areas_for_improvement.map((a, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">→</span> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      className="flex flex-col items-center justify-center py-8 text-center gap-3"
                    >
                      <BrainCircuit className="h-10 w-10 text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma análise realizada ainda.<br />Envie um clipe para receber feedback do scout.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Upload Card */}
            <Card className="flex flex-col items-center justify-center text-center p-6 border-dashed border-2 hover:border-primary/50 transition-colors">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4">
                {uploading || analyzing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <BrainCircuit className="h-8 w-8" />
                  </motion.div>
                ) : (
                  <UploadCloud className="h-8 w-8" />
                )}
              </div>
              <h3 className="text-lg font-bold mb-2">
                {analyzing ? "Analisando..." : uploading ? "Extraindo frames..." : "Nova Análise"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-[16rem]">
                {isPro
                  ? "Faça upload de um vídeo de até 3 minutos para um raio-x completo da sua performance."
                  : "Assine o Plano Pro para análises ilimitadas de gameplay."}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="video-upload"
              />
              {isPro ? (
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer inline-flex items-center bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50 text-sm"
                >
                  <UploadCloud className="h-4 w-4 mr-2" />
                  {uploading || analyzing ? "Processando..." : "Enviar Clipe"}
                </label>
              ) : (
                <Link
                  href="/subscription"
                  className={buttonVariants({ className: "rounded-full" })}
                >
                  <Crown className="h-4 w-4 mr-2" /> Assinar Plano Pro
                </Link>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ─── Evolution Tab ─── */}
        <TabsContent value="history">
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
                  {/* Simple sparkline-style chart */}
                  <div className="h-40 flex items-end gap-1.5 px-2">
                    {profileData?.scoreHistory.map((entry, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-card border border-border text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {entry.score}/100
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${entry.score}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          className={`w-full rounded-t-sm ${
                            entry.score >= 70 ? "bg-emerald-500/70" : entry.score >= 45 ? "bg-amber-500/70" : "bg-red-500/70"
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
        </TabsContent>
      </Tabs>

    </div>
  );
}

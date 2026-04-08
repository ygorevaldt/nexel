"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BrainCircuit, Trophy, Target, Shield, Star, Lock, MessageCircle, ExternalLink, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface ProfileData {
  id: string;
  nickname: string;
  game_id: string;
  bio: string | null;
  rank: string;
  global_score: number;
  highlight_video_url: string | null;
  social_links: { instagram?: string; youtube?: string; tiktok?: string };
  metrics: {
    matches_played: number;
    wins: number;
    losses: number;
    headshot_rate: number;
    winRate: number;
  };
  ai_score_history: { score: number; date: string }[];
  latest_analysis: {
    overall_potential_score: number;
    recruiter_feedback: string | null;
    strengths: string[];
    highlights: string[];
    recommended_playstyle: string | null;
    analyzed_at: string;
  } | null;
  contact_info: { discord?: string; whatsapp?: string } | null;
  is_contact_visible: boolean;
}

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/profile/${id}`)
      .then((r) => r.json())
      .then((json) => setProfile(json.data ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 md:py-16 px-4 space-y-6">
        <div className="h-48 rounded-2xl bg-muted/20 animate-pulse" />
        <div className="h-64 rounded-2xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl py-8 md:py-16 px-4 text-center text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Perfil não encontrado</h2>
      </div>
    );
  }

  const scoreColor =
    profile.global_score >= 75
      ? "text-emerald-400"
      : profile.global_score >= 50
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="container max-w-4xl py-5 md:py-10 px-4 md:px-8 space-y-4 md:space-y-6">

      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="relative overflow-hidden bg-card/50 border-border/50">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-purple-500/10 pointer-events-none" />

          <CardContent className="relative pt-5 md:pt-8 pb-4 md:pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Avatar + Name */}
              <div className="flex items-center gap-5">
                <Avatar className="h-24 w-24 ring-4 ring-primary/30">
                  <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
                    {profile.nickname.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold tracking-tight">{profile.nickname}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-bold uppercase">
                      {profile.rank}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      ID: {profile.game_id}
                    </Badge>
                  </div>
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground max-w-xs">{profile.bio}</p>
                  )}
                  {/* Social Links */}
                  <div className="flex items-center gap-2">
                    {profile.social_links?.instagram && (
                      <a href={`https://instagram.com/${profile.social_links.instagram}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        <ExternalLink className="h-3 w-3" /> Instagram
                      </a>
                    )}
                    {profile.social_links?.youtube && (
                      <a href={`https://youtube.com/@${profile.social_links.youtube}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        <ExternalLink className="h-3 w-3" /> YouTube
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Global Score */}
              <div className="md:ml-auto flex flex-col items-center p-5 rounded-2xl bg-muted/30 border border-border/50 min-w-[120px] text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">
                  AI Score
                </span>
                <span className={`text-5xl font-black tabular-nums ${scoreColor}`}>
                  {profile.global_score > 0 ? profile.global_score : "—"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">/100</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">

        {/* Stats Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 border-border/50 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" /> Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {[
                { label: "Partidas", value: profile.metrics.matches_played },
                { label: "Vitórias", value: profile.metrics.wins, color: "text-emerald-400" },
                { label: "Win Rate", value: `${profile.metrics.winRate}%`, color: "text-emerald-400" },
                { label: "Headshot %", value: `${profile.metrics.headshot_rate}%` },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3 rounded-xl bg-muted/20 border border-border/30 text-center">
                  <div className={`text-xl font-black tabular-nums ${color ?? ""}`}>{value}</div>
                  <div className="text-[10px] uppercase text-muted-foreground font-bold">{label}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recruiter Contact Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-card/50 border-border/50 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-primary" /> Contato (Scout)
              </CardTitle>
              <CardDescription>
                Dados de contato para recrutamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.is_contact_visible && profile.contact_info ? (
                <div className="space-y-3">
                  {profile.contact_info.discord && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <Shield className="h-4 w-4 text-indigo-400" />
                      <span className="text-sm font-medium">{profile.contact_info.discord}</span>
                    </div>
                  )}
                  {profile.contact_info.whatsapp && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <MessageCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium">{profile.contact_info.whatsapp}</span>
                    </div>
                  )}
                  {!profile.contact_info.discord && !profile.contact_info.whatsapp && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Jogador não informou dados de contato ainda.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dados de contato visíveis apenas para assinantes do{" "}
                    <span className="font-bold text-foreground">Plano Scout</span>.
                  </p>
                  <Link
                    href="/subscription"
                    className={buttonVariants({ size: "sm", className: "rounded-full mt-1" })}
                  >
                    Assinar Plano Scout
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recruiter Feedback */}
      {profile.latest_analysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BrainCircuit className="h-4 w-4 text-primary" /> Avaliação do Recrutador de Elite
              </CardTitle>
              <CardDescription>
                Score potencial:{" "}
                <span className={`font-bold ${scoreColor}`}>
                  {profile.latest_analysis.overall_potential_score}/100
                </span>
                {profile.latest_analysis.recommended_playstyle && (
                  <> · Posição recomendada:{" "}
                    <span className="font-bold text-foreground">{profile.latest_analysis.recommended_playstyle}</span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-5">
              {profile.latest_analysis.recruiter_feedback && (
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    &quot;{profile.latest_analysis.recruiter_feedback}&quot;
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {profile.latest_analysis.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase text-emerald-400 mb-2">Pontos Fortes</p>
                    <ul className="space-y-1.5">
                      {profile.latest_analysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Star className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {profile.latest_analysis.highlights.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase text-primary mb-2">Destaques do Clipe</p>
                    <ul className="space-y-1.5">
                      {profile.latest_analysis.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Trophy className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Score Evolution (mini chart) */}
      {profile.ai_score_history.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" /> Evolução do Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-24 flex items-end gap-1.5">
                {profile.ai_score_history.map((entry, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-card border border-border text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {entry.score}
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
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

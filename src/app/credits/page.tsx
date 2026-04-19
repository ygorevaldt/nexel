"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Trophy, Crown, Zap, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

interface CreditsData {
  subscriptionStatus: string;
  welcome_analysis_credits: number;
  welcome_booyah_credits: number;
}

const PRO_BENEFITS = [
  "5 análises de gameplay por dia",
  "Feedback do Recrutador de Elite",
  "Histórico de evolução do score",
  "Perfil destacado no ranking",
];

const SCOUT_BENEFITS = [
  "Tudo do plano PRO",
  "Acesso a contatos de todos os jogadores",
  "Filtros avançados de busca de talentos",
  "Badge verificado no perfil",
];

export default function CreditsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/credits");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me/credits")
      .then((r) => r.json())
      .then((json) => setCredits(json.data ?? null))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="container max-w-3xl mx-auto py-10 px-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const isPaid = credits?.subscriptionStatus === "PRO" || credits?.subscriptionStatus === "SCOUT";

  return (
    <div className="container max-w-3xl mx-auto py-8 md:py-12 px-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Meus Créditos</h1>
        <p className="text-muted-foreground text-sm">
          Créditos de boas-vindas para explorar a plataforma gratuitamente.
        </p>
      </div>

      {/* Current plan badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Plano atual:</span>
        <Badge className="text-xs uppercase font-bold px-3 py-1">
          {credits?.subscriptionStatus ?? "FREE"}
        </Badge>
      </div>

      {/* Welcome Credits Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Análises de IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${(credits?.welcome_analysis_credits ?? 0) > 0 ? "text-primary" : "text-muted-foreground/30"}`}>
                  {credits?.welcome_analysis_credits ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">créditos restantes</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isPaid
                  ? "Seu plano inclui análises ilimitadas — créditos de boas-vindas não expiraram."
                  : "Cada crédito permite enviar um clipe para análise completa do Coach IA."}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Trophy className="h-4 w-4 text-primary" />
                Registros Booyah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${(credits?.welcome_booyah_credits ?? 0) > 0 ? "text-primary" : "text-muted-foreground/30"}`}>
                  {credits?.welcome_booyah_credits ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">créditos restantes</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isPaid
                  ? "Seu plano inclui registros diários de vitórias — créditos de boas-vindas não expiraram."
                  : "Cada crédito permite registrar uma vitória no seu perfil."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upgrade CTA — only shown for FREE users */}
      {!isPaid && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* PRO Plan */}
            <Card className="relative overflow-hidden border-primary/30 bg-linear-to-br from-primary/5 to-transparent">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Plano PRO
                </CardTitle>
                <p className="text-2xl font-black">
                  R$ 29,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {PRO_BENEFITS.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href="/subscription" className={buttonVariants({ className: "w-full rounded-full" })}>
                  Assinar PRO
                </Link>
              </CardContent>
            </Card>

            {/* SCOUT Plan */}
            <Card className="relative overflow-hidden border-border/30 bg-card/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  Plano SCOUT
                </CardTitle>
                <p className="text-2xl font-black">
                  R$ 99,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {SCOUT_BENEFITS.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href="/subscription" className={buttonVariants({ variant: "outline", className: "w-full rounded-full" })}>
                  Assinar SCOUT
                </Link>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}

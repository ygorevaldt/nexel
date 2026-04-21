"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Trophy, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { PlanCard, PlanCardPlan } from "@/components/PlanCard";

interface CreditsData {
  subscriptionStatus: string;
  welcome_analysis_credits: number;
  welcome_booyah_credits: number;
  availablePlans: PlanCardPlan[];
}

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
      <div className="container max-w-7xl mx-auto py-10 px-4 md:px-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const isPaid = credits?.subscriptionStatus === "PRO" || credits?.subscriptionStatus === "SCOUT";

  return (
    <div className="container max-w-7xl mx-auto py-6 md:py-10 px-4 md:px-8 space-y-6 md:space-y-8">
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
      {!isPaid && (credits?.availablePlans?.length ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-stretch">
            {credits!.availablePlans.map((plan, idx) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={idx}
                currentStatus={credits?.subscriptionStatus ?? "FREE"}
                actionHref="/subscription"
                actionLabel={`Assinar ${plan.name}`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

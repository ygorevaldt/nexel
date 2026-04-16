"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { Crown, CheckCircle, Star, BrainCircuit, Users, Zap, History, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  stripePriceId: string | null;
  features: string[];
}

interface SubscriptionData {
  subscriptionStatus: string;
  accountType: string;
  subscriptionEndDate: string | null;
  availablePlans: Plan[];
  transactions: {
    id: string;
    date: string;
    type: string;
    plan: string;
    amount: number;
    status: string;
  }[];
}

export const AVAILABLE_PLANS: Plan[] = [
  {
    id: 'PRO',
    name: 'Jogador Pro',
    description: 'Análises de IA ilimitadas + histórico completo de evolução',
    priceMonthly: 2990,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? null,
    features: [
      'Análises de gameplay ilimitadas',
      'Histórico de evolução (AI Score)',
      'Feedback do Recrutador de Elite',
      'Perfil destacado no ranking',
    ],
  },
  {
    id: 'SCOUT',
    name: 'Scout / Time',
    description: 'Acesso a dados de contato + filtros avançados de busca de talentos',
    priceMonthly: 9990,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SCOUT ?? null,
    features: [
      'Tudo do Plano Pro',
      'Acesso a dados de contato dos jogadores',
      'Filtros avançados de busca de talentos',
      'Exportar relatórios de jogadores',
      'Badge verificado no perfil',
    ],
  },
];

function SubscriptionContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchParams.get("success") !== "true") return;

    const sessionId = searchParams.get("session_id");

    const handleSuccess = async () => {
      // Se há um session_id, veio do checkout Stripe — verifica e ativa o plano
      // diretamente sem depender do timing do webhook checkout.session.completed.
      if (sessionId) {
        try {
          await fetch(`/api/checkout/verify?session_id=${sessionId}`);
        } catch {
          // Se falhar, o webhook ainda pode ativar — continua o fluxo
        }
      }

      // Atualiza os dados exibidos na página após a ativação
      await fetchData();

      toast.success("Assinatura ativada com sucesso!", {
        description: "Seu plano foi atualizado. Aproveite os novos recursos.",
      });

      router.replace("/subscription");
    };

    handleSuccess();
  }, [searchParams, router, fetchData]);

  const handleUpgrade = async (plan: Plan) => {
    if (status === "unauthenticated") {
      toast.info("Faça login para assinar", {
        description: "Você será redirecionado para acessar sua conta.",
      });
      router.push("/login?callbackUrl=/subscription");
      return;
    }

    const serverPlan = data?.availablePlans.find((p) => p.id === plan.id);
    if (!serverPlan?.stripePriceId) {
      toast.info("Integração com pagamento em breve! 🚀", {
        description: "Nossa equipe está finalizando a integração com Stripe. Em breve você poderá assinar.",
      });
      return;
    }

    setCheckingOut(plan.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao iniciar checkout");
        return;
      }
      window.location.href = json.checkoutUrl;
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setCheckingOut(null);
    }
  };

  const handleCancel = async () => {
    setCancelDialogOpen(false);
    setCancelling(true);
    try {
      const res = await fetch("/api/me/subscription", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao cancelar assinatura");
        return;
      }
      toast.success("Assinatura cancelada", {
        description: "Seu plano foi revertido para FREE.",
      });
      await fetchData();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setCancelling(false);
    }
  };

  const currentStatus = data?.subscriptionStatus ?? "FREE";
  const isActive = currentStatus !== "FREE";

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="container max-w-7xl mx-auto py-8 md:py-16 px-4 space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 md:py-10 px-4 md:px-8 space-y-6 md:space-y-10">

      {/* Header */}
      <div className="text-center space-y-6 py-8 md:py-4 md:pb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
          <Crown className="h-4 w-4" />
          Planos & Assinaturas
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Invista na sua carreira
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Desbloqueie análises de IA, apareça no radar dos maiores scouts do Free Fire,
          e acelere sua evolução como pro-player.
        </p>
      </div>

      {/* Current Plan Banner */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-bold text-emerald-400">
                Plano {currentStatus} Ativo
              </p>
              {data?.subscriptionEndDate && (
                <p className="text-xs text-muted-foreground">
                  Renova em:{" "}
                  {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(
                    new Date(data.subscriptionEndDate)
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              ATIVO
            </Badge>
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <AlertDialogTrigger
                disabled={cancelling}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 bg-transparent border-0 p-0 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Seu plano será revertido para FREE imediatamente. Não há
                    reembolso do período restante. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      )}

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-stretch">
        {AVAILABLE_PLANS.map((plan, idx) => {
          const isCurrentPlan = currentStatus === plan.id;
          const planIcons = [BrainCircuit, Users];
          const PlanIcon = planIcons[idx] ?? Star;

          const planColors = [
            {
              gradient: "from-primary/20 via-primary/10 to-transparent",
              border: isCurrentPlan ? "border-primary" : "border-border/50 hover:border-primary/50",
              badge: "bg-primary/10 text-primary border-primary/20",
              button: isCurrentPlan
                ? "bg-muted text-muted-foreground cursor-default"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            },
            {
              gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
              border: isCurrentPlan ? "border-purple-500" : "border-border/50 hover:border-purple-500/50",
              badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
              button: isCurrentPlan
                ? "bg-muted text-muted-foreground cursor-default"
                : "bg-purple-600 text-white hover:bg-purple-700",
            },
          ][idx] ?? {
            gradient: "from-primary/20 to-transparent",
            border: "border-border/50",
            badge: "bg-primary/10 text-primary",
            button: "bg-primary text-primary-foreground",
          };

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="h-full"
            >
              <Card className={`relative overflow-hidden border-2 transition-all duration-300 h-full flex flex-col ${planColors.border}`}>
                <div className={`absolute inset-0 bg-linear-to-b ${planColors.gradient} pointer-events-none`} />

                <CardHeader className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase border rounded-full px-3 py-1 ${planColors.badge}`}>
                      <PlanIcon className="h-3.5 w-3.5" />
                      {plan.name}
                    </div>
                    {isCurrentPlan && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Plano Atual
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-black">
                    R$ {(plan.priceMonthly / 100).toFixed(2).replace(".", ",")}
                    <span className="text-sm font-normal text-muted-foreground ml-1">/mês</span>
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="relative space-y-6 flex flex-col flex-1">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrentPlan || checkingOut !== null}
                    className={`w-full h-11 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${planColors.button}`}
                  >
                    {isCurrentPlan ? (
                      <>
                        <CheckCircle className="h-4 w-4" /> Plano Ativo
                      </>
                    ) : checkingOut === plan.id ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Redirecionando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        {plan.id === "SCOUT" && currentStatus === "PRO"
                          ? "Fazer Upgrade para SCOUT"
                          : `Assinar ${plan.name}`}
                      </>
                    )}
                  </button>

                  {/* PRO → SCOUT upgrade note */}
                  {plan.id === "SCOUT" && currentStatus === "PRO" && (
                    <p className="text-center text-[10px] text-amber-400/80 leading-relaxed">
                      Ao fazer upgrade, o plano SCOUT é ativado imediatamente.
                      Não há reembolso do período restante do plano anterior.
                    </p>
                  )}

                  {!data?.availablePlans.find((p) => p.id === plan.id)?.stripePriceId && (
                    <p className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                      Pagamentos via Stripe — em breve
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Transaction History (Only visible if logged in) */}
      {status === "authenticated" && (data?.transactions.length ?? 0) > 0 && (
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold tracking-tight">Histórico de Pagamentos</h2>
          </div>

          <Card className="border-border/30 shadow-none bg-card/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-[10px] uppercase">Data</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase">Tipo</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase">Plano</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.transactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/20 border-border/20 transition-colors">
                    <TableCell className="text-muted-foreground text-xs">{tx.date}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {tx.type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      {tx.plan && (
                        <Badge variant="outline" className="text-[10px] uppercase">{tx.plan}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-black ${tx.status === "COMPLETED"
                            ? "text-emerald-400 border-emerald-400/20"
                            : "text-amber-400 border-amber-400/20"
                          }`}
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black tabular-nums text-emerald-400">
                      R$ {tx.amount.toFixed(2).replace(".", ",")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense>
      <SubscriptionContent />
    </Suspense>
  );
}

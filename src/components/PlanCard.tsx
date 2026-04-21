"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BrainCircuit, Users, Star, CheckCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface PlanCardPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  stripePriceId?: string | null;
  features: string[];
}

interface PlanCardProps {
  plan: PlanCardPlan;
  index: number;
  currentStatus?: string;
  /** Called when user clicks the action button (subscription page flow) */
  onAction?: (plan: PlanCardPlan) => void;
  /** If provided, the action button renders as a Link instead of button */
  actionHref?: string;
  /** Override the default button label */
  actionLabel?: string;
  /** Shows spinner and disables the button */
  loading?: boolean;
}

const PLAN_ICONS = [BrainCircuit, Users];

const PLAN_COLORS = [
  {
    gradient: "from-primary/20 via-primary/10 to-transparent",
    borderActive: "border-primary",
    borderIdle: "border-border/50 hover:border-primary/50",
    badge: "bg-primary/10 text-primary border-primary/20",
    buttonActive: "bg-primary text-primary-foreground hover:bg-primary/90",
    buttonDisabled: "bg-muted text-muted-foreground cursor-default",
  },
  {
    gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
    borderActive: "border-purple-500",
    borderIdle: "border-border/50 hover:border-purple-500/50",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    buttonActive: "bg-purple-600 text-white hover:bg-purple-700",
    buttonDisabled: "bg-muted text-muted-foreground cursor-default",
  },
];

export function PlanCard({
  plan,
  index,
  currentStatus = "FREE",
  onAction,
  actionHref,
  actionLabel,
  loading = false,
}: PlanCardProps) {
  const isCurrentPlan = currentStatus === plan.id;
  const PlanIcon = PLAN_ICONS[index] ?? Star;
  const colors = PLAN_COLORS[index] ?? PLAN_COLORS[0];
  const borderClass = isCurrentPlan ? colors.borderActive : colors.borderIdle;

  const defaultLabel = actionLabel ?? `Assinar ${plan.name}`;

  const buttonContent = loading ? (
    <>
      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      Redirecionando...
    </>
  ) : isCurrentPlan ? (
    <>
      <CheckCircle className="h-4 w-4" /> Plano Ativo
    </>
  ) : (
    <>
      <Zap className="h-4 w-4" />
      {defaultLabel}
    </>
  );

  const buttonClass = `w-full h-11 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${isCurrentPlan ? colors.buttonDisabled : colors.buttonActive
    }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card
        className={`relative overflow-hidden border-2 transition-all duration-300 h-full flex flex-col ${borderClass}`}
      >
        <div
          className={`absolute inset-0 bg-linear-to-b ${colors.gradient} pointer-events-none`}
        />

        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase border rounded-full px-3 py-1 ${colors.badge}`}
            >
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
            {(plan.priceMonthly / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
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

          <div className="mt-auto space-y-2">
            {actionHref && !isCurrentPlan ? (
              <Link href={actionHref} className={buttonClass}>
                <Zap className="h-4 w-4" />
                {defaultLabel}
              </Link>
            ) : (
              <button
                onClick={() => onAction?.(plan)}
                disabled={isCurrentPlan || loading}
                className={buttonClass}
              >
                {buttonContent}
              </button>
            )}

            {plan.stripePriceId === null && (
              <p className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                Pagamentos via Stripe — em breve
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

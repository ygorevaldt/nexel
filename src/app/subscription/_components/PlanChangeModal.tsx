"use client";

import { useState } from "react";
import { AlertTriangle, Info, ArrowUpCircle, ArrowDownCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type PlanConsentAction = "CANCEL" | "UPGRADE" | "DOWNGRADE";
export type PlanTier = "FREE" | "PRO" | "SCOUT";

const PLAN_LABELS: Record<PlanTier, string> = {
  FREE: "Free",
  PRO: "Pro",
  SCOUT: "Scout",
};



interface PlanChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: PlanConsentAction;
  fromPlan: PlanTier;
  toPlan: PlanTier;
  toPlanPrice?: number;
  renewalDate?: string | null;
  onConfirm: () => Promise<void>;
}

function getModalConfig(action: PlanConsentAction, fromPlan: PlanTier, toPlan: PlanTier, targetPriceStr: string) {
  if (action === "CANCEL") {
    return {
      icon: XCircle,
      iconClass: "text-destructive",
      title: `Cancelar plano ${PLAN_LABELS[fromPlan]}?`,
      description: `Ao cancelar, você perderá imediatamente todo o acesso aos recursos do plano ${PLAN_LABELS[fromPlan]}. Não há reembolso do período restante.`,
      advisory: `Dica: cancele próximo da sua data de renovação para aproveitar ao máximo os benefícios já pagos.`,
      consentLabel: `Entendo que perderei acesso imediatamente ao plano ${PLAN_LABELS[fromPlan]} e que não há reembolso.`,
      confirmLabel: "Sim, cancelar agora",
      confirmClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };
  }

  if (action === "DOWNGRADE") {
    return {
      icon: ArrowDownCircle,
      iconClass: "text-amber-400",
      title: `Fazer downgrade para ${PLAN_LABELS[toPlan]}?`,
      description: `Ao fazer o downgrade, você perderá imediatamente todos os benefícios exclusivos do plano ${PLAN_LABELS[fromPlan]}.`,
      advisory: `Dica: faça o downgrade próximo da sua data de renovação para aproveitar ao máximo os benefícios já pagos.`,
      consentLabel: `Entendo que perderei imediatamente os benefícios do plano ${PLAN_LABELS[fromPlan]}.`,
      confirmLabel: `Confirmar downgrade para ${PLAN_LABELS[toPlan]}`,
      confirmClass: "bg-amber-600 text-white hover:bg-amber-700",
    };
  }

  const isSwitch = fromPlan !== "FREE";

  return {
    icon: ArrowUpCircle,
    iconClass: "text-primary",
    title: `Assinar plano ${PLAN_LABELS[toPlan]}?`,
    description: isSwitch
      ? `Seu plano ${PLAN_LABELS[fromPlan]} atual será substituído pelo ${PLAN_LABELS[toPlan]}. Para ativar o novo plano, você precisará pagar o valor integral de ${targetPriceStr}/mês.`
      : `Para ativar o plano ${PLAN_LABELS[toPlan]}, você precisará realizar o pagamento do valor integral de ${targetPriceStr}/mês.`,
    advisory: null,
    consentLabel: `Entendo que precisarei realizar o pagamento de ${targetPriceStr}/mês para ativar o plano ${PLAN_LABELS[toPlan]}.`,
    confirmLabel: `Prosseguir para pagamento`,
    confirmClass: "",
  };
}

export function PlanChangeModal({
  open,
  onOpenChange,
  action,
  fromPlan,
  toPlan,
  toPlanPrice,
  renewalDate,
  onConfirm,
}: PlanChangeModalProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const formattedPrice = toPlanPrice 
    ? `R$ ${(toPlanPrice / 100).toFixed(2).replace('.', ',')}` 
    : "";
  const config = getModalConfig(action, fromPlan, toPlan, formattedPrice);
  const Icon = config.icon;

  const formattedRenewal = renewalDate
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(
        new Date(renewalDate)
      )
    : null;

  const handleConfirm = async () => {
    if (!checked) return;
    setLoading(true);
    try {
      const res = await fetch("/api/me/subscription/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, from_plan: fromPlan, to_plan: toPlan }),
      });
      if (!res.ok) {
        toast.error("Não foi possível registrar seu consentimento. Tente novamente.");
        return;
      }
      onOpenChange(false);
      await onConfirm();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
      setChecked(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!loading) {
      setChecked(false);
      onOpenChange(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <Icon className={`h-5 w-5 shrink-0 ${config.iconClass}`} />
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {config.advisory && (
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              {config.advisory}
              {formattedRenewal && (
                <> Sua próxima renovação seria em <strong>{formattedRenewal}</strong>.</>
              )}
            </p>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`h-4 w-4 rounded border-2 transition-colors flex items-center justify-center
                ${checked
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/40 group-hover:border-primary/50"
                }`}
            >
              {checked && (
                <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-muted-foreground leading-relaxed">
            {config.consentLabel}
          </span>
        </label>

        {action !== "UPGRADE" && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive/80 leading-relaxed">
              Esta ação não pode ser desfeita. O acesso será revogado imediatamente.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!checked || loading}
            className={config.confirmClass || undefined}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Aguarde...
              </span>
            ) : (
              config.confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

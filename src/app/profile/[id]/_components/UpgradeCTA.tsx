import { Lock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function UpgradeCTA() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Lock className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 space-y-1">
          <h3 className="text-base font-bold">Conteúdo bloqueado</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Assine o <strong className="text-foreground">PRO</strong> para ver scores detalhados,
            análises completas e histórico deste jogador.
          </p>
        </div>

        <Link
          href="/subscription"
          className={buttonVariants({ className: "rounded-full shrink-0 whitespace-nowrap" })}
        >
          Assinar PRO
        </Link>
      </div>

      {/* Decorative gradient blur */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
    </div>
  );
}

import Link from "next/link";
import { ExternalLink, Shield } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/60 bg-muted dark:bg-[oklch(0.08_0_0)] mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">

        {/* Layout principal: coluna no mobile, grid no desktop */}
        <div className="flex flex-col gap-6 md:grid md:grid-cols-[1fr_auto] md:items-start md:gap-12">

          {/* Coluna esquerda: marca + aviso legal */}
          <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left">

            {/* Marca */}
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <span className="text-sm font-bold tracking-wide text-foreground">Nexel</span>

            </div>

            {/* Copyright */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              © {year} Nexel. Todos os direitos reservados.
            </p>

            {/* Aviso legal — hierarquia inferior, mais apagado */}
            <p className="text-[11px] text-muted-foreground/50 leading-relaxed max-w-sm border-l-2 border-border/30 pl-3 italic">
              Este site não possui qualquer vínculo com a{" "}
              <span className="font-medium text-muted-foreground/70 not-italic">Garena</span>{" "}
              ou seus produtos. Free Fire é uma marca registrada da Garena.
            </p>
          </div>

          {/* Coluna direita: crédito do autor */}
          <div className="flex flex-col items-center md:items-end gap-1.5">
            <span className="text-[11px] text-muted-foreground/50 uppercase tracking-widest font-medium">
              Desenvolvido por
            </span>
            <Link
              href="https://github.com/ygorevaldt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
            >
              Ygor Evaldt
              <ExternalLink
                className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />
            </Link>
          </div>

        </div>

        {/* Separador + rodapé mínimo no mobile */}
        <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-center md:justify-start">
          <p className="text-[10px] text-muted-foreground/30 tracking-wide uppercase">
            Nexel — Plataforma de descoberta de talentos Free Fire
          </p>
        </div>

      </div>
    </footer>
  );
}

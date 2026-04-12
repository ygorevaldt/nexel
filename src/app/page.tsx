"use client";

import Link from "next/link";
import { Sparkles, Trophy, BrainCircuit, ChevronRight, Star, Target } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-24 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-background to-background">
        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-8 md:mb-8 animate-pulse max-w-xs text-center leading-snug">
          <Sparkles className="mr-2 h-4 w-4 shrink-0" />
          O Espaço Nexel para Pro-Players do Free Fire
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mb-6 md:mb-6">
          Prove seu talento, seja{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-400">
            descoberto por scouts
          </span>{" "}
          e evolua como pro-player.
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mb-10 md:mb-10">
          Nossa IA analisa sua gameplay com a precisão de um técnico profissional.
          Suba no ranking, exiba seu perfil e conecte-se com as maiores organizações do Brasil.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {!session && (
            <motion.div
              className="relative rounded-full"
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 0 0px 0px rgba(255,179,0,0)",
                  "0 0 12px 3px rgba(255,179,0,0.35)",
                  "0 0 0px 0px rgba(255,179,0,0)",
                ],
              }}
              transition={{
                boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                scale: { type: "spring", stiffness: 350, damping: 15 },
              }}
            >
              {/* Container com overflow hidden para o shimmer não vazar */}
              <div className="relative overflow-hidden rounded-full">
                <Link
                  href="/register"
                  className={buttonVariants({
                    size: "lg",
                    className: "relative h-12 px-8 text-lg rounded-full",
                  })}
                >
                  Criar Perfil Grátis <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
                {/* Shimmer: tira brilhante que atravessa o botão da esquerda pra direita */}
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-2/5"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
                  }}
                  animate={{ left: ["-40%", "140%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.2,
                    ease: "linear",
                    repeatDelay: 1,
                  }}
                />
              </div>
            </motion.div>
          )}
          {session ? (
            /* Logado: botão principal com glow + shimmer */
            <motion.div
              className="relative rounded-full"
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 0 0px 0px rgba(255,179,0,0)",
                  "0 0 12px 3px rgba(255,179,0,0.35)",
                  "0 0 0px 0px rgba(255,179,0,0)",
                ],
              }}
              transition={{
                boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                scale: { type: "spring", stiffness: 350, damping: 15 },
              }}
            >
              <div className="relative overflow-hidden rounded-full">
                <Link
                  href="/feed"
                  className={buttonVariants({
                    size: "lg",
                    className: "relative h-12 px-8 text-lg rounded-full",
                  })}
                >
                  Explorar Talentos
                </Link>
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-2/5"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
                  }}
                  animate={{ left: ["-40%", "140%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.2,
                    ease: "linear",
                    repeatDelay: 1,
                  }}
                />
              </div>
            </motion.div>
          ) : (
            /* Não logado: ação secundária, visível em dark e light mode */
            <Link
              href="/feed"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className:
                  "h-12 px-8 text-lg rounded-full border-2 border-foreground/30 text-foreground hover:bg-foreground/8 dark:border-foreground/25 dark:text-foreground",
              })}
            >
              Explorar Talentos
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24 px-4 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

          <div className="p-5 md:p-8 rounded-2xl bg-card border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4 md:mb-6">
              <BrainCircuit className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Coach IA (PRO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Faça upload de clipes. Nossa IA analisa movimentação, uso de gelo e rotação
              e te entrega o feedback de um Recrutador de Elite das maiores orgs do Brasil.
            </p>
          </div>

          <div className="p-5 md:p-8 rounded-2xl bg-card border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors transform md:-translate-y-4 shadow-xl shadow-primary/5">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4 md:mb-6">
              <Trophy className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Ranking Global</h3>
            <p className="text-muted-foreground leading-relaxed">
              Compita em desafios 1x1 e 4x4 e suba no ranking baseado em vitórias reais e
              score de IA. Quanto melhor seu jogo, maior sua posição no leaderboard.
            </p>
          </div>

          <div className="p-5 md:p-8 rounded-2xl bg-card border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4 md:mb-6">
              <Star className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Vitrine de Talentos</h3>
            <p className="text-muted-foreground leading-relaxed">
              Perfil focado em métricas que importam. Seja descoberto por olheiros e líderes
              de grandes organizações que procuram o próximo talento do Free Fire.
            </p>
          </div>

        </div>

        {/* Social proof row */}
        <div className="max-w-7xl mx-auto mt-8 md:mt-16 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span>Score de IA calculado por análise real de gameplay</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span>Ranking baseado em vitórias + potencial técnico</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Scouts das maiores orgs do Brasil na plataforma</span>
          </div>
        </div>
      </section>
    </div>
  );
}

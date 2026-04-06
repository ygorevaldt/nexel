"use client";

import Link from "next/link";
import { Sparkles, Trophy, BrainCircuit, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-8 animate-pulse">
          <Sparkles className="mr-2 h-4 w-4" />
          Bem-vindo à nova era do Free Fire
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mb-6">
          Acelere sua skill, descubra talentos e <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">monetize sua gameplay</span>.
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mb-10">
          O primeiro ecosistema operado por IA que funciona como um CT de Bolso. 
          Desafie jogadores, melhore sua movimentação e suba de nível com análise profissional.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register" className={buttonVariants({ size: "lg", className: "h-12 px-8 text-lg rounded-full" })}>
            Começar Gratuitamente <ChevronRight className="ml-2 h-4 w-4"/>
          </Link>
          <Link href="/feed" className={buttonVariants({ size: "lg", variant: "outline", className: "h-12 px-8 text-lg rounded-full" })}>
            Explorar Talentos
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-muted/30 border-t border-border/50">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-8 rounded-2xl bg-card border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
              <BrainCircuit className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3">IA Coach (PRO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Faça upload de clipes. Nossa Visão Computacional analisa sua movimentação, tempo de gelo e erros de rotação automaticamente.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors transform md:-translate-y-4 shadow-xl shadow-primary/5">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
              <Trophy className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Apostas Seguras</h3>
            <p className="text-muted-foreground leading-relaxed">
              Desafios 1x1 e 4x4. Sistema de cofre (escrow) seguro. A IA decide o ganhador através da screenshot com 100% de neutralidade.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Radar de Times</h3>
            <p className="text-muted-foreground leading-relaxed">
              Perfil focado em métricas que importam. Chame a atenção de olheiros e líderes de guildas procurando line-ups experientes.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}

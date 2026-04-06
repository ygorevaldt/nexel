"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Crosshair, Map, ShieldAlert, Activity } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  // Mock data for the MVP
  const aiScore = 85;

  return (
    <div className="container max-w-7xl py-10 px-4 md:px-8 space-y-8">
      
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-primary/20">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {session?.user?.name?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{session?.user?.name || "Player One"}</h1>
            <div className="flex items-center text-muted-foreground gap-2 text-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              ID: 18273645 • Guilda: Elite Force
            </div>
            <div className="inline-flex items-center rounded-sm bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Mestre I
            </div>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end p-4 rounded-xl bg-background/50 border border-border">
          <span className="text-sm text-muted-foreground font-medium mb-1">Health Score Geral</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-400">
              {aiScore}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <Progress value={aiScore} className="h-2 w-32 mt-2 [&>div]:bg-primary" />
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 h-12">
          <TabsTrigger value="overview" className="h-full rounded-lg">Visão Geral (IA)</TabsTrigger>
          <TabsTrigger value="history" className="h-full rounded-lg">Progresso</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Movimentação</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-400">92%</div>
                <p className="text-xs text-muted-foreground">Excelente fluidez</p>
                <Progress value={92} className="h-1 w-full mt-3 [&>div]:bg-emerald-400" />
              </CardContent>
            </Card>

            <Card className="bg-card hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uso de Gelo</CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-400">70%</div>
                <p className="text-xs text-muted-foreground">Tempo de resposta médio 1.2s</p>
                <Progress value={70} className="h-1 w-full mt-3 [&>div]:bg-amber-400" />
              </CardContent>
            </Card>

            <Card className="bg-card hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rotação</CardTitle>
                <Map className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-400">88%</div>
                <p className="text-xs text-muted-foreground">Boa leitura de safe zone</p>
                <Progress value={88} className="h-1 w-full mt-3 [&>div]:bg-emerald-400" />
              </CardContent>
            </Card>

            <Card className="bg-card hover:bg-card/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Precisão</CardTitle>
                <Crosshair className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">45%</div>
                <p className="text-xs text-muted-foreground">Capas inconsistentes (foco principal)</p>
                <Progress value={45} className="h-1 w-full mt-3 [&>div]:bg-red-400" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
             <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  Feedbacks da Inteligência Artificial
                </CardTitle>
                <CardDescription>Baseado nas suas últimas 5 partidas analisadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <h4 className="text-red-400 font-semibold mb-1 text-sm">Ponto Crítico</h4>
                    <p className="text-sm text-foreground/80">Você está se expondo muito em campo aberto antes de ter certeza de cobertura. A IA identificou 4 mortes evitáveis por falta de gelo rápido no aberto.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="text-emerald-400 font-semibold mb-1 text-sm">Ponto Forte</h4>
                    <p className="text-sm text-foreground/80">Suas rotações após o segundo fechamento da zona são nível Pró. Continue focando em prever o final de partida.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 flex flex-col items-center justify-center text-center p-6 border-dashed border-2">
               <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4">
                 <BrainCircuit className="h-8 w-8" />
               </div>
               <h3 className="text-lg font-bold mb-2">Treine com a IA</h3>
               <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
                 Faça upload de um vídeo de até 3 minutos ou cole link do YouTube para ter um raio-x completo do seu jogo.
               </p>
               <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-medium transition-colors">
                 Nova Análise
               </button>
            </Card>
          </div>

        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Recente</CardTitle>
              <CardDescription>
                Seu histórico ainda não possui dados baseados na IA. Realize análises primeiro.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
              Sem dados suficientes
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}

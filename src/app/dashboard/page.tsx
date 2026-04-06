"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Crosshair, Map, ShieldAlert, Activity, UploadCloud } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="container max-w-7xl py-10 px-4 md:px-8 space-y-8">

      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 ring-4 ring-primary/20">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">{session?.user?.name || "—"}</h1>
            <div className="text-sm text-muted-foreground">
              {(session?.user as any)?.freefire_id
                ? `ID: ${(session?.user as any).freefire_id}`
                : "ID Free Fire não informado"}
            </div>
            <div className="inline-flex items-center rounded-sm bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {(session?.user as any)?.role || "FREE"}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end p-4 rounded-xl bg-muted/30 border border-border">
          <span className="text-sm text-muted-foreground font-medium mb-1">Score Geral</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-muted-foreground/30">—</span>
          </div>
          <span className="text-xs text-muted-foreground mt-1">Realize análises para calcular</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 h-12">
          <TabsTrigger value="overview" className="h-full rounded-lg">Visão Geral (IA)</TabsTrigger>
          <TabsTrigger value="history" className="h-full rounded-lg">Progresso</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

          {/* Metric cards — empty state */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Movimentação", icon: Activity },
              { label: "Uso de Gelo", icon: ShieldAlert },
              { label: "Rotação", icon: Map },
              { label: "Precisão", icon: Crosshair },
            ].map(({ label, icon: Icon }) => (
              <Card key={label} className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground/30">—</div>
                  <p className="text-xs text-muted-foreground mt-1">Sem dados ainda</p>
                  <div className="h-1 w-full mt-3 rounded-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  Feedbacks da Inteligência Artificial
                </CardTitle>
                <CardDescription>Baseado nas suas últimas análises enviadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <BrainCircuit className="h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma análise realizada ainda.<br />Envie um clipe para receber feedback.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col items-center justify-center text-center p-6 border-dashed border-2">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">Analise seu jogo</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-70">
                Faça upload de um vídeo de até 3 minutos para ter um raio-x completo da sua performance.
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
              <CardTitle>Histórico de Progresso</CardTitle>
              <CardDescription>
                Seu histórico aparecerá aqui após realizar análises com a IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Sem análises realizadas
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}

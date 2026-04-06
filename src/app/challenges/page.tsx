"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trophy, Swords, Users, Clock, AlertTriangle, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_OPEN_CHALLENGES = [
  { id: "1", creator: "Killer_PVP", type: "1v1", stake: 20, map: "Bermuda", rank: "Mestre" },
  { id: "2", creator: "Elite_Squad", type: "4v4", stake: 100, map: "Purgatório", rank: "Diamante" },
  { id: "3", creator: "NoobMaster69", type: "1v1", stake: 5, map: "Kalahari", rank: "Ouro" },
];

const MOCK_MY_HISTORY = [
  { id: "h1", opponent: "ProPlayer_7", type: "1v1", stake: 50, result: "WIN", status: "COMPLETED", date: "2 horas atrás" },
  { id: "h2", opponent: "Ghost_XX", type: "4v4", stake: 40, result: "LOSS", status: "COMPLETED", date: "Ontem" },
];

export default function ChallengesPage() {
  const [stakeInput, setStakeInput] = useState("10");

  const platformFee = Number(stakeInput) * 0.1;
  const totalToPay = Number(stakeInput) + platformFee;

  return (
    <div className="container max-w-7xl py-10 px-4 md:px-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between bg-linear-to-br from-card to-background p-8 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Swords className="h-40 w-40" />
        </div>
        
        <div className="space-y-4 relative z-10">
          <Badge className="bg-primary/20 text-primary border-primary/30 py-1">Arena de Desafios</Badge>
          <h1 className="text-4xl font-extrabold tracking-tighter">Pronto para o <span className="text-primary italic">X1?</span></h1>
          <p className="text-muted-foreground max-w-lg">
            Desafie outros jogadores na arena Elite Hub. O vencedor leva o pote, 
            e nossa IA garante que o resultado seja justo.
          </p>
          <div className="flex gap-4 pt-2">
            <Dialog>
              <DialogTrigger className={buttonVariants({ className: "h-11 px-8 rounded-full shadow-lg shadow-primary/20" })}>
                  Criar Novo Desafio <Swords className="ml-2 h-4 w-4" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border/60">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 pb-2">
                     <Zap className="h-5 w-5 text-primary" /> Configurar Desafio
                  </DialogTitle>
                  <DialogDescription>
                    O valor da aposta (Stake) será retido pela plataforma até o fim da partida.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Tipo de Jogo</label>
                    <div className="grid grid-cols-2 gap-2">
                       <Button variant="outline" className="border-primary bg-primary/5">1v1</Button>
                       <Button variant="outline">4v4</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Aposta (R$)</label>
                    <Input 
                      type="number" 
                      value={stakeInput} 
                      onChange={(e) => setStakeInput(e.target.value)}
                      className="bg-muted text-lg font-bold"
                    />
                  </div>
                  
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 mt-2">
                    <div className="flex justify-between text-xs">
                       <span className="text-muted-foreground">Taxa da Plataforma (10%)</span>
                       <span className="font-medium">R$ {platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm border-t border-border/20 pt-2">
                       <span>Total para Ingressar</span>
                       <span className="text-primary">R$ {totalToPay.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-11 rounded-full">Publicar Desafio</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="h-11 px-8 rounded-full">Como funciona?</Button>
          </div>
        </div>

        <div className="flex gap-4 md:flex-col lg:flex-row">
           <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 min-w-[140px] text-center">
              <div className="text-2xl font-black text-primary">243</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Ativos hoje</div>
           </div>
           <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 min-w-[140px] text-center">
              <div className="text-2xl font-black">R$ 1.2k</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Em disputa</div>
           </div>
        </div>
      </div>

      <Tabs defaultValue="matchmaking" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 h-12 bg-muted/40 p-1">
          <TabsTrigger value="matchmaking" className="h-full rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Abertos</TabsTrigger>
          <TabsTrigger value="history" className="h-full rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Seu Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="matchmaking" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_OPEN_CHALLENGES.map((challenge, idx) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:border-primary/50 transition-all group">
                   <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                         <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs uppercase">
                            {challenge.creator.charAt(0)}
                         </div>
                         <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">{challenge.creator}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase">{challenge.type}</Badge>
                   </CardHeader>
                   <CardContent className="space-y-4 pt-4">
                      <div className="flex justify-between items-end">
                         <div className="space-y-1">
                            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tighter">Stake</span>
                            <div className="text-2xl font-black text-foreground">R$ {challenge.stake}</div>
                         </div>
                         <div className="text-right">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                               <Clock className="h-3 w-3" /> Criado há 10m
                            </div>
                            <div className="text-xs font-bold text-primary">{challenge.map}</div>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg text-xs text-muted-foreground">
                         <Users className="h-3 w-3" /> Elos permitidos: {challenge.rank}+
                      </div>
                   </CardContent>
                   <CardFooter className="pt-0">
                      <Button className="w-full bg-foreground text-background hover:bg-primary hover:text-white transition-all font-bold">Aceitar Desafio</Button>
                   </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none bg-muted/20 backdrop-blur">
             <CardContent className="p-0">
                <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead>
                         <tr className="border-b border-border/50">
                            <th className="text-left p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Oponente</th>
                            <th className="text-left p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Modo</th>
                            <th className="text-left p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Valor</th>
                            <th className="text-left p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Status</th>
                            <th className="text-left p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Resultado</th>
                            <th className="text-right p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Data</th>
                         </tr>
                      </thead>
                      <tbody>
                         {MOCK_MY_HISTORY.map((h) => (
                           <tr key={h.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                              <td className="p-4 font-bold">{h.opponent}</td>
                              <td className="p-4 text-xs">{h.type}</td>
                              <td className="p-4 font-bold text-primary">R$ {h.stake}</td>
                              <td className="p-4">
                                 <Badge variant="outline" className="text-[9px] uppercase font-black">{h.status}</Badge>
                              </td>
                              <td className="p-4">
                                 <span className={`text-xs font-black uppercase ${h.result === 'WIN' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {h.result}
                                 </span>
                              </td>
                              <td className="p-4 text-right text-muted-foreground text-xs">{h.date}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Alert Rule */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex gap-4">
         <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
         <div className="space-y-1">
            <h4 className="font-bold text-amber-500">Regras de Fair Play</h4>
            <p className="text-sm text-foreground/80 leading-relaxed">
               Uso de macros, emuladores não autorizados ou qualquer auxílio externo resultará em <span className="font-bold">Banimento Permanente</span>.
               Nossa IA analisa o padrão de jogo de todas as partidas desafiadas para detectar fraudes.
            </p>
         </div>
      </div>

    </div>
  );
}

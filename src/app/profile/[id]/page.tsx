"use client";

import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Video, MessageCircle, Trophy, Target, Shield, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Mock data for public profile
  const profile = {
    nickname: "Nobru_Elite",
    rank: "Desafiante",
    bio: "Focado em camps e torneios 4x4. Buscando organização profissional. Especialista em rush e granada.",
    score: 98,
    stats: {
      headshots: "65%",
      kd: "4.2",
      matches: "1,450",
      winRate: "72%"
    },
    social: {
       instagram: "@nobru_hub",
       youtube: "Nobru Games",
       twitter: "@nobru_oficial"
    }
  };

  return (
    <div className="container max-w-7xl py-10 px-4 md:px-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Profile Header Card */}
      <div className="relative group">
         <div className="absolute -inset-1 bg-linear-to-r from-primary to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
         <div className="relative bg-card rounded-3xl border border-border/50 p-8 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left overflow-hidden">
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Shield className="h-64 w-64" />
            </div>

            <Avatar className="h-40 w-40 ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
               <AvatarFallback className="text-5xl font-black bg-linear-to-br from-primary/30 to-purple-500/30 text-primary">
                 {profile.nickname.charAt(0)}
               </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-6">
               <div className="space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                     <h1 className="text-4xl font-black tracking-tight">{profile.nickname}</h1>
                     <Badge className="w-fit mx-auto md:mx-0 bg-primary/20 text-primary border-primary/30 font-bold uppercase">{profile.rank}</Badge>
                     <Badge variant="outline" className="w-fit mx-auto md:mx-0 text-emerald-400 border-emerald-400/20 font-bold">VERIFICADO</Badge>
                  </div>
                  <p className="text-muted-foreground max-w-xl text-lg">{profile.bio}</p>
               </div>

               <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Button variant="outline" size="sm" className="rounded-full gap-2 border-border/60 hover:border-primary/40 bg-muted/20">
                     <ImageIcon className="h-4 w-4" /> {profile.social.instagram}
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full gap-2 border-border/60 hover:border-primary/40 bg-muted/20">
                     <Video className="h-4 w-4" /> {profile.social.youtube}
                  </Button>
               </div>

               <div className="flex items-center gap-4 pt-4">
                  <Button className="rounded-full px-8 h-12 shadow-lg shadow-primary/20">Recrutar Jogador</Button>
                  <Button variant="ghost" className="rounded-full h-12 w-12 border border-border/40"><Heart className="h-5 w-5" /></Button>
               </div>
            </div>

            <div className="w-full md:w-auto flex flex-col items-center md:items-end justify-center p-6 border border-border/30 rounded-2xl bg-muted/10 drop-shadow-sm min-w-[200px]">
               <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2">AI Score Final</span>
               <div className="text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-400 leading-tight">
                  {profile.score}
               </div>
               <div className="w-full space-y-1.5 mt-4">
                  <Progress value={profile.score} className="h-1.5 [&>div]:bg-primary" />
                  <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                    <span>Performance Top 2%</span>
                    <span>Pro-Player</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden border-border/30 shadow-none bg-card/20 backdrop-blur">
               <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                     <Target className="h-5 w-5 text-primary" /> Métricas de Combate
                  </CardTitle>
               </CardHeader>
               <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8 text-center bg-muted/10">
                  <div className="space-y-1">
                     <div className="text-[10px] uppercase font-bold text-muted-foreground">K.D Ratio</div>
                     <div className="text-3xl font-black text-foreground">{profile.stats.kd}</div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[10px] uppercase font-bold text-muted-foreground">Headshots</div>
                     <div className="text-3xl font-black text-emerald-400">{profile.stats.headshots}</div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[10px] uppercase font-bold text-muted-foreground">Partidas</div>
                     <div className="text-3xl font-black text-foreground">{profile.stats.matches}</div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[10px] uppercase font-bold text-muted-foreground">Taxa de Vit.</div>
                     <div className="text-3xl font-black text-primary">{profile.stats.winRate}</div>
                  </div>
               </CardContent>
            </Card>

            <Tabs defaultValue="highlights" className="w-full">
               <TabsList className="bg-muted/40 border border-border/20 p-1 mb-6 rounded-xl">
                  <TabsTrigger value="highlights" className="rounded-lg font-bold">Clipes Destacados</TabsTrigger>
                  <TabsTrigger value="achievements" className="rounded-lg font-bold">Conquistas</TabsTrigger>
               </TabsList>
               <TabsContent value="highlights">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {[1, 2].map((i) => (
                       <div key={i} className="aspect-video bg-muted/50 rounded-2xl border border-border/30 flex items-center justify-center group overflow-hidden relative">
                          <Trophy className="h-8 w-8 text-muted-foreground opacity-20" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Button size="sm" variant="secondary" className="rounded-full shadow-lg">Assistir Jogada</Button>
                          </div>
                          <div className="absolute bottom-4 left-4">
                             <Badge className="bg-black/80">Rush Insano {i}</Badge>
                          </div>
                       </div>
                     ))}
                  </div>
               </TabsContent>
               <TabsContent value="achievements" className="py-20 text-center text-muted-foreground border border-dashed rounded-3xl">
                  Conquistas em desenvolvimento
               </TabsContent>
            </Tabs>
         </div>

         <div className="space-y-8">
            <Card className="bg-linear-to-br from-card to-background border-border/40 shadow-sm relative overflow-hidden">
               <CardHeader>
                  <CardTitle className="text-lg">Destaques na Arena Hub</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="flex gap-4 items-center">
                     <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-black">#3</div>
                     <div className="flex-1">
                        <p className="text-sm font-bold">Ranking Semanal</p>
                        <p className="text-xs text-muted-foreground">Desafiante Solo</p>
                     </div>
                  </div>
                  <div className="flex gap-4 items-center">
                     <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500">
                        <Trophy className="h-5 w-5" />
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-bold">Incorruptível</p>
                        <p className="text-xs text-muted-foreground">Nenhuma denúncia em 100 partidas</p>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-blue-500/5 border-blue-500/20 text-center p-8">
               <h3 className="font-bold text-blue-400 mb-2">Olheiro Corporativo?</h3>
               <p className="text-xs text-muted-foreground mb-6">Obtenha acesso aos logs de performance brutos deste jogador sob demanda.</p>
               <Button variant="outline" className="w-full rounded-full border-blue-500/20 text-blue-400 hover:bg-blue-500/10">Contatar Gerente</Button>
            </Card>
         </div>
      </div>

    </div>
  );
}

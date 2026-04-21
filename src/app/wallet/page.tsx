"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, Download, History, PiggyBank, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: string;
  ref: string;
}

interface WalletData {
  balance: number;
  stats: { totalWon: number; totalFees: number; inEscrow: number };
  transactions: Transaction[];
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [depositAmount, setDepositAmount] = useState("50");
  const [withdrawAmount, setWithdrawAmount] = useState("50");
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet');
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // silently fail if unauthenticated
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const handleDeposit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(depositAmount) }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Erro'); return; }
      toast.success('Depósito realizado!');
      setDepositOpen(false);
      fetchWallet();
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(withdrawAmount) }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Erro'); return; }
      toast.success('Saque solicitado!');
      setWithdrawOpen(false);
      fetchWallet();
    } finally {
      setSubmitting(false);
    }
  };

  const balance = data?.balance ?? 0;
  const stats = data?.stats ?? { totalWon: 0, totalFees: 0, inEscrow: 0 };
  const transactions = data?.transactions ?? [];

  return (
    <div className="container max-w-7xl py-10 px-4 md:px-8 space-y-8">

      {/* Balance Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 relative overflow-hidden bg-linear-to-br from-primary via-primary/90 to-purple-600 border-none text-white shadow-2xl shadow-primary/20 p-2">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wallet className="h-32 w-32" />
           </div>

           <CardHeader className="pb-2">
              <CardTitle className="text-white/80 font-medium text-sm uppercase tracking-widest">Saldo Disponível</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
              <div className="flex items-baseline gap-2">
                 <span className="text-5xl font-black tabular-nums tracking-tighter">R$ {balance.toFixed(2)}</span>
                 <Badge className="bg-white/20 text-white border-none hover:bg-white/30">ATIVO</Badge>
              </div>
              <div className="flex gap-4 pt-4">
                 <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                   <DialogTrigger className={buttonVariants({ className: "bg-white text-primary font-bold hover:bg-white/90 rounded-full h-11 px-8 shadow-lg" })}>
                     <Plus className="mr-2 h-4 w-4" /> Depositar PIX
                   </DialogTrigger>
                   <DialogContent className="sm:max-w-3xl w-full max-h-[88vh] overflow-y-auto bg-card border-border/60">
                     <DialogHeader>
                       <DialogTitle>Depositar via PIX</DialogTitle>
                       <DialogDescription>Valor simulado — nenhuma cobrança real é feita.</DialogDescription>
                     </DialogHeader>
                     <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="my-4" />
                     <DialogFooter>
                       <Button onClick={handleDeposit} disabled={submitting} className="w-full">
                         {submitting ? 'Processando...' : `Depositar R$ ${Number(depositAmount).toFixed(2)}`}
                       </Button>
                     </DialogFooter>
                   </DialogContent>
                 </Dialog>

                 <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                   <DialogTrigger className={buttonVariants({ variant: "ghost", className: "text-white border border-white/20 hover:bg-white/10 rounded-full h-11 px-8" })}>
                     <Download className="mr-2 h-4 w-4" /> Sacar Funds
                   </DialogTrigger>
                   <DialogContent className="sm:max-w-3xl w-full max-h-[88vh] overflow-y-auto bg-card border-border/60">
                     <DialogHeader>
                       <DialogTitle>Sacar Saldo</DialogTitle>
                       <DialogDescription>Saldo disponível: R$ {balance.toFixed(2)}</DialogDescription>
                     </DialogHeader>
                     <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="my-4" />
                     <DialogFooter>
                       <Button onClick={handleWithdraw} disabled={submitting} className="w-full">
                         {submitting ? 'Processando...' : `Sacar R$ ${Number(withdrawAmount).toFixed(2)}`}
                       </Button>
                     </DialogFooter>
                   </DialogContent>
                 </Dialog>
              </div>
           </CardContent>
           <CardFooter className="bg-black/10 text-[10px] uppercase font-bold text-white/60 tracking-wider">
              KYC VALIDADO • CUIDADO COM FRAUDES
           </CardFooter>
        </Card>

        <Card className="bg-muted/10 border-border/40 backdrop-blur-sm">
           <CardHeader>
              <CardTitle className="text-lg">Stats Financeiros</CardTitle>
           </CardHeader>
           <CardContent className="space-y-5">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                       <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Total Ganhos</span>
                 </div>
                 <span className="font-bold text-emerald-400">R$ {stats.totalWon.toFixed(2)}</span>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                       <PiggyBank className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Taxas Pagas</span>
                 </div>
                 <span className="font-bold text-primary">R$ {stats.totalFees.toFixed(2)}</span>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                       <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Em Aberto</span>
                 </div>
                 <span className="font-bold text-blue-400">R$ {stats.inEscrow.toFixed(2)}</span>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
         <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold tracking-tight">Histórico de Transações</h2>
         </div>

         <Card className="border-border/30 shadow-none bg-card/20 overflow-hidden">
            <Table>
               <TableHeader className="bg-muted/30">
                  <TableRow>
                     <TableHead className="w-[150px] font-bold text-[10px] uppercase">Data</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase">Descrição</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase text-center">Status</TableHead>
                     <TableHead className="text-right font-bold text-[10px] uppercase">Valor</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="p-8 text-center text-muted-foreground">
                        Nenhuma transação ainda
                      </TableCell>
                    </TableRow>
                  ) : transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/20 border-border/20 transition-colors">
                       <TableCell className="text-muted-foreground text-xs">{tx.date}</TableCell>
                       <TableCell className="font-medium">
                          <div className="flex flex-col">
                             <span className="text-sm font-bold">{tx.type.replace(/_/g, ' ')}</span>
                             {tx.ref && <span className="text-[10px] text-muted-foreground uppercase">{tx.ref}</span>}
                          </div>
                       </TableCell>
                       <TableCell className="text-center">
                          <Badge variant="outline" className={`text-[9px] uppercase font-black ${tx.status === 'COMPLETED' ? 'text-emerald-400 border-emerald-400/20' : 'text-amber-400 border-amber-400/20'}`}>
                             {tx.status}
                          </Badge>
                       </TableCell>
                       <TableCell className={`text-right font-black tabular-nums ${tx.amount > 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                       </TableCell>
                    </TableRow>
                  ))}
               </TableBody>
            </Table>
         </Card>
      </div>

      {/* Fraud Notice Footer */}
      <div className="p-8 rounded-3xl bg-muted/30 border border-dashed border-border flex flex-col md:flex-row items-center gap-8 justify-between">
         <div className="space-y-2">
            <h3 className="text-lg font-bold">Segurança e KYC</h3>
            <p className="text-sm text-muted-foreground max-w-xl">
               Saques acima de R$ 500,00 requerem a validação de identidade (KYC).
               Esteja ciente que o <span className="text-foreground font-medium underline">Fair Play</span> é monitorado em todos os desafios apostados.
            </p>
         </div>
         <Button variant="outline" className="rounded-full h-11 px-8 gap-2 border-border/60 hover:bg-background">
            Configurações de Saque <ArrowDownRight className="h-4 w-4" />
         </Button>
      </div>

    </div>
  );
}

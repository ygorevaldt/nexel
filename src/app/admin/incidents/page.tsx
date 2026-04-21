"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HeadphonesIcon,
  Loader2,
  ShieldAlert,
} from "lucide-react";

interface IncidentUser {
  _id: string;
  email: string;
  name: string;
}

interface Incident {
  _id: string;
  userId: IncidentUser;
  description: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: "OPEN" | "RESOLVED" }) {
  if (status === "RESOLVED") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
        Resolvido
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20">
      Aberto
    </Badge>
  );
}

export default function AdminIncidentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchIncidents = useCallback(async (targetPage: number) => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/admin/incidents?page=${targetPage}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao buscar incidentes.");
        return;
      }
      setIncidents(data.data.reports);
      setTotal(data.data.total);
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.systemRole !== "ADM") {
      router.push("/dashboard");
      return;
    }
    fetchIncidents(page);
  }, [session, status, page, fetchIncidents, router]);

  const handleResolve = async (incident: Incident) => {
    setResolvingId(incident._id);
    try {
      const res = await fetch(`/api/admin/incidents/${incident._id}/resolve`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao resolver incidente.");
        return;
      }
      toast.success("Incidente marcado como resolvido e usuário notificado.");
      setIncidents((prev) =>
        prev.map((i) => (i._id === incident._id ? { ...i, status: "RESOLVED" } : i))
      );
      if (selectedIncident?._id === incident._id) {
        setSelectedIncident((prev) => (prev ? { ...prev, status: "RESOLVED" } : null));
      }
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setResolvingId(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
          <ShieldAlert className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Painel de Incidentes</h1>
          <p className="text-sm text-muted-foreground">
            {total} chamado{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
          </p>
        </div>
      </motion.div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
            Chamados de suporte
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingList ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Nenhum incidente registrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {incidents.map((incident, index) => (
                    <motion.tr
                      key={incident._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/30 hover:bg-muted/20 cursor-pointer"
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <p className="text-sm">{incident.userId?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{incident.userId?.email ?? "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-muted-foreground truncate">
                          {incident.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={incident.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(incident.createdAt)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {incident.status === "OPEN" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={resolvingId === incident._id}
                            onClick={() => handleResolve(incident)}
                            className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            {resolvingId === incident._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Marcar resolvido"
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Resolvido</span>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}

          {!loadingList && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selectedIncident !== null}
        onOpenChange={(open) => { if (!open) setSelectedIncident(null); }}
      >
        <DialogContent className="sm:max-w-3xl w-full max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4" />
              Detalhes do chamado
            </DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{selectedIncident.userId?.name ?? "Usuário removido"}</p>
                  <p className="text-sm text-muted-foreground">{selectedIncident.userId?.email ?? "—"}</p>
                </div>
                <StatusBadge status={selectedIncident.status} />
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm whitespace-pre-wrap">{selectedIncident.description}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Enviado em {formatDate(selectedIncident.createdAt)}
              </p>
              {selectedIncident.status === "OPEN" && (
                <Button
                  className="w-full"
                  disabled={resolvingId === selectedIncident._id}
                  onClick={() => handleResolve(selectedIncident)}
                >
                  {resolvingId === selectedIncident._id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resolvendo...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar como resolvido
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

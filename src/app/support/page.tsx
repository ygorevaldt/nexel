"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  HeadphonesIcon,
  Loader2,
  Plus,
} from "lucide-react";
import { useSentinel } from "@/hooks/useSentinel";

const MIN_DESCRIPTION_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 2000;

interface Incident {
  id: string;
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
      <Badge className="gap-1.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        Resolvido
      </Badge>
    );
  }
  return (
    <Badge className="gap-1.5 bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20">
      <Clock className="h-3 w-3" />
      Aberto
    </Badge>
  );
}

function IncidentForm({
  onSuccess,
  onClose,
}: {
  onSuccess: (incident: Incident) => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const remaining = MAX_DESCRIPTION_LENGTH - description.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      toast.error(`Descreva o problema com pelo menos ${MIN_DESCRIPTION_LENGTH} caracteres.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao enviar o chamado.");
        return;
      }
      toast.success("Chamado aberto com sucesso!");
      onSuccess({
        id: data.data.id,
        description: description.trim(),
        status: "OPEN",
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Descreva o problema
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder="Explique com detalhes o que aconteceu: qual funcionalidade estava usando, o que esperava e o que ocorreu de fato..."
          rows={10}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          autoFocus
        />
        <p className="text-xs text-muted-foreground text-right">
          {remaining} caracteres restantes
        </p>
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar chamado"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchIncidents = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/support?page=${pageNum}`);
      const data = await res.json();
      if (res.ok) {
        const incoming: Incident[] = data.data ?? [];
        setHasMore(data.hasMore ?? false);
        setIncidents((prev) => append ? [...prev, ...incoming] : incoming);
        setPage(pageNum);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    fetchIncidents(1, false);
  }, [session, status, fetchIncidents, router]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchIncidents(page + 1, true);
  }, [loadingMore, hasMore, page, fetchIncidents]);

  const sentinelRef = useSentinel(loadMore, hasMore && !loading && !loadingMore);

  const handleNewIncident = (incident: Incident) => {
    setIncidents((prev) => [incident, ...prev]);
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <HeadphonesIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Suporte</h1>
            <p className="text-sm text-muted-foreground">
              {incidents.length > 0
                ? `${incidents.length} chamado${incidents.length !== 1 ? "s" : ""} registrado${incidents.length !== 1 ? "s" : ""}`
                : "Relate um problema ou envie feedback"}
            </p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Abrir chamado
        </Button>
      </motion.div>

      {/* Welcome message */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5 space-y-1"
      >
        <p className="text-sm font-semibold text-foreground">
          Estamos aqui por você 👋
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sabemos que encontrar um problema no meio da sua jornada é frustrante — e levamos isso a sério.
          Nossa equipe analisa cada chamado com atenção e trabalha para resolver o mais rápido possível.
          Você não está sozinho. Descreva o que aconteceu com o máximo de detalhes e a gente cuida do resto.
        </p>
      </motion.div>

      {/* Incidents list */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : incidents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <HeadphonesIcon className="h-14 w-14 mb-4 text-muted-foreground/20" />
            <p className="text-base font-medium text-muted-foreground">Nenhum chamado aberto</p>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">
              Encontrou um problema na plataforma? Clique em "Abrir chamado" e nossa equipe irá analisar.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {incidents.map((incident, index) => {
              const isExpanded = expanded === incident.id;
              const isLong = incident.description.length > 180;

              return (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.3) }}
                  className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-3 hover:border-border/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>#{incident.id.slice(-6).toUpperCase()}</span>
                      <span>·</span>
                      <span>{formatDate(incident.createdAt)}</span>
                    </div>
                    <StatusBadge status={incident.status} />
                  </div>

                  <div>
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {isLong && !isExpanded
                        ? incident.description.slice(0, 180) + "..."
                        : incident.description}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : incident.id)}
                        className="mt-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        {isExpanded ? "Ver menos" : "Ver mais"}
                      </button>
                    )}
                  </div>

                  {incident.status === "RESOLVED" && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <p className="text-xs text-emerald-400">
                        Chamado resolvido pela equipe Nexel. Verifique suas notificações.
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Modal — form */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-3xl w-full max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4" />
              Abrir novo chamado
            </DialogTitle>
          </DialogHeader>
          <IncidentForm
            onSuccess={handleNewIncident}
            onClose={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

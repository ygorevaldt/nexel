"use client";

import { useState } from "react";
import {
  Star,
  AlertCircle,
  Trophy,
  Video,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AnalysisItem {
  id: string;
  overall_potential_score: number;
  movement_score: number;
  gloo_wall_usage: number;
  rotation_efficiency: number;
  recruiter_feedback: string | null;
  strengths: string[];
  areas_for_improvement: string[];
  highlights: string[];
  recommended_playstyle: string | null;
  analyzed_at: string | Date;
  video_url: string | null;
}

interface AnalysisListProps {
  initialAnalyses: AnalysisItem[];
  total: number;
  profileId: string;
}

function getScoreColor(score: number) {
  if (score >= 71) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function formatDate(dateStr: string | Date) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function AnalysisList({ initialAnalyses, total, profileId }: AnalysisListProps) {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>(initialAnalyses);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const loadMore = async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/profile/${profileId}/analyses?page=${nextPage}`);
      if (!res.ok) return;
      const json = await res.json();
      const newAnalyses: AnalysisItem[] = json.analyses ?? [];
      setAnalyses((prev) => [...prev, ...newAnalyses]);
      setPage(nextPage);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const hasMore = analyses.length < total;

  if (analyses.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p>Nenhuma análise realizada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => {
        const isExpanded = expandedIds.has(analysis.id);
        const scoreColor = getScoreColor(analysis.overall_potential_score);

        return (
          <Card key={analysis.id} className="bg-card/50 border-border/50 overflow-hidden">
            <CardContent className="p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(analysis.analyzed_at)}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black tabular-nums ${scoreColor}`}>
                      {analysis.overall_potential_score}
                      <span className="text-sm font-normal text-muted-foreground">/100</span>
                    </span>
                  </div>
                </div>

                {/* Mini scores */}
                <div className="flex items-center gap-4 text-xs text-center">
                  {[
                    { label: "Mov.", value: analysis.movement_score },
                    { label: "Gelo", value: analysis.gloo_wall_usage },
                    { label: "Rot.", value: analysis.rotation_efficiency },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className={`text-sm font-bold ${getScoreColor(value)}`}>{value}</div>
                      <div className="text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {analysis.video_url && (
                    <a
                      href={analysis.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Ver clipe
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => toggleExpand(analysis.id)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5 mr-1" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5 mr-1" />
                        Ver análise completa
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="space-y-4 pt-2">
                  <Separator className="bg-border/40" />

                  {/* Recruiter feedback */}
                  {analysis.recruiter_feedback && (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        &quot;{analysis.recruiter_feedback}&quot;
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    {analysis.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase text-emerald-400 mb-2">
                          Pontos Fortes
                        </p>
                        <ul className="space-y-1.5">
                          {analysis.strengths.map((s, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-muted-foreground"
                            >
                              <Star className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Areas for improvement */}
                    {analysis.areas_for_improvement.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase text-amber-400 mb-2">
                          Áreas de Melhoria
                        </p>
                        <ul className="space-y-1.5">
                          {analysis.areas_for_improvement.map((a, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-muted-foreground"
                            >
                              <AlertCircle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Highlights */}
                    {analysis.highlights.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase text-primary mb-2">
                          Destaques do Clipe
                        </p>
                        <ul className="space-y-1.5">
                          {analysis.highlights.map((h, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-muted-foreground"
                            >
                              <Trophy className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended playstyle */}
                    {analysis.recommended_playstyle && (
                      <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                          Estilo Recomendado
                        </p>
                        <div className="inline-flex items-center rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-sm font-medium text-primary">
                          {analysis.recommended_playstyle}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
            className="rounded-full"
          >
            {loading ? "Carregando..." : `Carregar mais (${total - analyses.length} restantes)`}
          </Button>
        </div>
      )}
    </div>
  );
}

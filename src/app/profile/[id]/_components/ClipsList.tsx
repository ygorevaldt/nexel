import { Video, ExternalLink } from "lucide-react";

interface Clip {
  id: string;
  video_url: string | null;
  analyzed_at: string | Date;
  score: number;
}

interface ClipsListProps {
  clips: Clip[];
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

export function ClipsList({ clips }: ClipsListProps) {
  if (!clips || clips.length === 0) {
    return (
      <div className="py-10 text-center">
        <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">Nenhum clipe enviado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clips.map((clip) => (
        <div
          key={clip.id}
          className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/20 border border-border/30"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                Clipe enviado em {formatDate(clip.analyzed_at)}
              </p>
              <p className={`text-xs font-bold ${getScoreColor(clip.score)}`}>
                Score: {clip.score}/100
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {clip.video_url ? (
              <a
                href={clip.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Assistir
              </a>
            ) : (
              <span className="text-xs text-muted-foreground/60">
                URL não disponível
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

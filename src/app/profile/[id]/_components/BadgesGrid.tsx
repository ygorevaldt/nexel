import {
  BrainCircuit,
  TrendingUp,
  Crown,
  Trophy,
  Shield,
  Zap,
  Star,
  type LucideIcon,
} from "lucide-react";

interface Badge {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

interface BadgesGridProps {
  badges: Badge[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  BrainCircuit,
  TrendingUp,
  Crown,
  Trophy,
  Shield,
  Zap,
  Star,
};

export function BadgesGrid({ badges }: BadgesGridProps) {
  if (!badges || badges.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Nenhuma conquista disponível ainda.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {badges.map((badge) => {
        const Icon = ICON_MAP[badge.icon] ?? Trophy;

        return (
          <div
            key={badge.id}
            title={badge.description}
            className={`
              relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center
              transition-all cursor-default
              ${
                badge.unlocked
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/10 border-border/30 opacity-50"
              }
            `}
          >
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center ${
                badge.unlocked ? "bg-primary/20" : "bg-muted/20"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  badge.unlocked ? "text-primary" : "text-muted-foreground/40"
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-bold leading-tight ${
                badge.unlocked ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {badge.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

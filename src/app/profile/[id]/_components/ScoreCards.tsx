import { Activity, Shield, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScoreCardsProps {
  scores: {
    movement: number;
    gloo_wall: number;
    rotation: number;
  };
}

function getScoreColor(value: number) {
  if (value > 75) return "text-emerald-400";
  if (value >= 50) return "text-amber-400";
  return "text-red-400";
}

function getProgressColor(value: number) {
  if (value > 75) return "[&>div]:bg-emerald-500";
  if (value >= 50) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

const scoreItems = [
  { key: "movement", label: "Movimentação", icon: Activity },
  { key: "gloo_wall", label: "Gelo (Gloo Wall)", icon: Shield },
  { key: "rotation", label: "Rotação", icon: Map },
] as const;

export function ScoreCards({ scores }: ScoreCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {scoreItems.map(({ key, label, icon: Icon }) => {
        const value = scores[key] ?? 0;
        const colorClass = getScoreColor(value);
        const progressClass = getProgressColor(value);

        return (
          <Card key={key} className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <span className={`text-3xl font-black tabular-nums ${colorClass}`}>
                {value}
              </span>
              <Progress
                value={value}
                className={`h-2 bg-muted/40 ${progressClass}`}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import { ExternalLink, Star, Lock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProfileHeaderProps {
  profile: {
    nickname: string;
    game_id: string;
    bio?: string | null;
    rank: string;
    global_score: number;
    plan: "FREE" | "PRO" | "SCOUT";
    social_links?: { instagram?: string; youtube?: string; tiktok?: string };
    score_delta?: number | null;
    is_own_profile: boolean;
    favorites_count?: number;
  };
  scoreHidden?: boolean;
}

function getScoreColor(score: number) {
  if (score >= 71) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function getPlanBadgeClass(plan: string) {
  if (plan === "SCOUT") return "bg-violet-500/15 text-violet-400 border-violet-500/30";
  if (plan === "PRO") return "bg-primary/15 text-primary border-primary/30";
  return "bg-muted/30 text-muted-foreground border-border/40";
}

export function ProfileHeader({ profile, scoreHidden = false }: ProfileHeaderProps) {
  const scoreColor = getScoreColor(profile.global_score);
  const planBadgeClass = getPlanBadgeClass(profile.plan);
  const initial = profile.nickname.charAt(0).toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card/50 border border-border/50 p-5 md:p-8">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Avatar + Info */}
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <Avatar className="h-20 w-20 shrink-0 ring-4 ring-primary/30 ring-offset-2 ring-offset-background">
            <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight leading-none">
                {profile.nickname}
              </h1>
              {profile.is_own_profile && (
                <span className="text-xs text-muted-foreground bg-muted/40 border border-border/40 rounded-full px-2 py-0.5">
                  Você
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Plan badge */}
              <span
                className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${planBadgeClass}`}
              >
                {profile.plan}
              </span>
              {/* Rank badge */}
              <Badge variant="outline" className="text-xs font-bold uppercase">
                {profile.rank}
              </Badge>
              {/* Game ID */}
              <span className="text-xs text-muted-foreground">
                ID: {profile.game_id}
              </span>
              {/* Favorites count */}
              {(profile.favorites_count ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-yellow-400 font-medium">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  {profile.favorites_count}
                </span>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                {profile.bio}
              </p>
            )}

            {/* Social links */}
            {profile.social_links && (
              <div className="flex items-center gap-3 flex-wrap">
                {profile.social_links.instagram && (
                  <a
                    href={`https://instagram.com/${profile.social_links.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Instagram
                  </a>
                )}
                {profile.social_links.youtube && (
                  <a
                    href={`https://youtube.com/@${profile.social_links.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    YouTube
                  </a>
                )}
                {profile.social_links.tiktok && (
                  <a
                    href={`https://tiktok.com/@${profile.social_links.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    TikTok
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Score */}
        <div className="flex flex-col items-center p-5 rounded-2xl bg-muted/30 border border-border/50 min-w-30 text-center shrink-0">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">
            AI Score
          </span>
          {scoreHidden ? (
            <div className="flex flex-col items-center gap-1 py-1">
              <Lock className="h-6 w-6 text-muted-foreground/40" />
              <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">PRO</span>
            </div>
          ) : (
            <>
              <span className={`text-5xl font-black tabular-nums leading-none ${scoreColor}`}>
                {profile.global_score > 0 ? profile.global_score : "—"}
              </span>
              <span className="text-xs text-muted-foreground mt-1">/100</span>
              {profile.score_delta != null && profile.score_delta !== 0 && (
                <span
                  className={`mt-2 text-xs font-bold ${
                    profile.score_delta > 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {profile.score_delta > 0 ? `+${profile.score_delta}` : profile.score_delta}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

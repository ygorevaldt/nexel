import { cookies } from "next/headers";
import { Trophy, TrendingUp, BrainCircuit, Swords, Medal, Film, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileHeader } from "./_components/ProfileHeader";
import { ScoreCards } from "./_components/ScoreCards";
import { ScoreChart } from "./_components/ScoreChart";
import { AnalysisList } from "./_components/AnalysisList";
import { VictoryHistory } from "./_components/VictoryHistory";
import { BadgesGrid } from "./_components/BadgesGrid";
import { ClipsList } from "./_components/ClipsList";
import { UpgradeCTA } from "./_components/UpgradeCTA";
import { ContactInfo } from "./_components/ContactInfo";

// Re-export types used by components
export interface AnalysisItem {
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
  analyzed_at: string;
  video_url: string | null;
}

interface ProfileData {
  id: string;
  nickname: string;
  game_id: string;
  bio: string | null;
  rank: string;
  global_score: number;
  plan: "FREE" | "PRO" | "SCOUT";
  social_links: { instagram?: string; youtube?: string; tiktok?: string };
  metrics: {
    matches_played: number;
    wins: number;
    losses: number;
    headshot_rate: number;
    winRate: number;
  };
  scores: { movement: number; gloo_wall: number; rotation: number } | null;
  score_delta: number | null;
  ai_score_history: { score: number; date: string }[];
  latest_analysis: {
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
    analyzed_at: string;
  } | null;
  analyses: AnalysisItem[];
  analyses_total: number;
  victories: {
    total_matches: number;
    total_wins: number;
    total_losses: number;
    win_rate: number;
    by_month: Array<{
      year: number;
      month: number;
      matches: number;
      wins: number;
      losses: number;
    }>;
  };
  badges: Array<{
    id: string;
    label: string;
    description: string;
    unlocked: boolean;
    icon: string;
  }>;
  clips: Array<{
    id: string;
    video_url: string | null;
    analyzed_at: string;
    score: number;
  }>;
  contact_info: { discord?: string; whatsapp?: string; email?: string; instagram?: string } | null;
  is_contact_visible: boolean;
  viewer_permission: "partial" | "full";
  is_own_profile: boolean;
  favorites_count: number;
  is_favorited: boolean;
}

type PartialProfileData = Pick<
  ProfileData,
  "id" | "nickname" | "game_id" | "rank" | "global_score" | "plan" | "viewer_permission" | "is_own_profile" | "favorites_count" | "is_favorited"
>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/profile/${id}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return { title: "Perfil | Nexel" };
    const json = await res.json();
    const nickname = json.data?.nickname ?? "Jogador";
    return { title: `${nickname} | Perfil - Nexel` };
  } catch {
    return { title: "Perfil | Nexel" };
  }
}

// Motion wrapper — must be a server-compatible approach
// Since motion.div is a client component, we wrap each section in a div
// and use CSS animation fallback for the server render.
// The page uses server components so we avoid framer-motion here.
// Instead, we'll add a thin wrapper client component for animations.

function Section({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  // Server-side: render with inline style for animation delay
  // The animation class uses Tailwind animate-fade-in-up (add to globals if needed)
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
    >
      {children}
    </div>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  let profileData: ProfileData | PartialProfileData | null = null;
  let fetchError = false;

  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/profile/${id}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      profileData = json.data ?? null;
    } else {
      fetchError = true;
    }
  } catch {
    fetchError = true;
  }

  if (fetchError || !profileData) {
    return (
      <div className="container max-w-7xl mx-auto py-16 px-4 text-center text-muted-foreground">
        <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <h2 className="text-2xl font-bold mb-2">Perfil não encontrado</h2>
        <p className="text-sm">
          O perfil que você está procurando não existe ou foi removido.
        </p>
      </div>
    );
  }

  // Partial view
  if (profileData.viewer_permission === "partial") {
    return (
      <div className="container max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-8 space-y-6">
        <Section delay={0}>
          <ProfileHeader
            profile={{
              nickname: profileData.nickname,
              game_id: profileData.game_id,
              rank: profileData.rank,
              global_score: profileData.global_score,
              plan: profileData.plan,
              is_own_profile: profileData.is_own_profile,
              favorites_count: profileData.favorites_count,
            }}
          />
        </Section>
        <Section delay={100}>
          <UpgradeCTA />
        </Section>
      </div>
    );
  }

  // Full view
  const full = profileData as ProfileData;

  return (
    <div className="container max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-8 space-y-6">
      {/* Header */}
      <Section delay={0}>
        <ProfileHeader
          profile={{
            nickname: full.nickname,
            game_id: full.game_id,
            bio: full.bio,
            rank: full.rank,
            global_score: full.global_score,
            plan: full.plan,
            social_links: full.social_links,
            score_delta: full.score_delta,
            is_own_profile: full.is_own_profile,
            favorites_count: full.favorites_count,
          }}
        />
      </Section>

      {/* Score Cards */}
      {full.scores && (
        <Section delay={100}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Scores de Habilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreCards scores={full.scores} />
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Chart + Victory History grid */}
      <Section delay={200}>
        <div className={`grid gap-4 md:gap-6 ${full.ai_score_history.length > 0 ? "md:grid-cols-2" : "grid-cols-1"}`}>
          {/* Evolução do Score: apenas próprio perfil ou SCOUT */}
          {full.ai_score_history.length > 0 && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Evolução do Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreChart history={full.ai_score_history} />
              </CardContent>
            </Card>
          )}

          {/* Victory History */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="h-4 w-4 text-primary" />
                Histórico de Vitórias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VictoryHistory victories={full.victories} />
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Analysis list */}
      {full.analyses_total > 0 && (
        <Section delay={300}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Análises da IA
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {full.analyses_total} análise{full.analyses_total !== 1 ? "s" : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisList
                initialAnalyses={full.analyses}
                total={full.analyses_total}
                profileId={full.id}
              />
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Badges */}
      {full.badges.length > 0 && (
        <Section delay={400}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Medal className="h-4 w-4 text-primary" />
                Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BadgesGrid badges={full.badges} />
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Clipes Enviados: apenas próprio perfil ou SCOUT */}
      {full.clips.length > 0 && (
        <Section delay={500}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Film className="h-4 w-4 text-primary" />
                Clipes Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClipsList clips={full.clips} />
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Contact info */}
      {full.is_contact_visible && full.contact_info && (
        <Section delay={600}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-primary" />
                Contato (Scout)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContactInfo contactInfo={full.contact_info} />
            </CardContent>
          </Card>
        </Section>
      )}
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findProfileByUserId } from "@/repositories/ProfileRepository";
import { findAnalysesByProfileIdPaginated, countTodayAnalyses } from "@/repositories/AiAnalysisRepository";

const DAILY_PRO_LIMIT = 5;
const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));

    // Find profile for this user
    const profile = await findProfileByUserId(session.user.id);
    if (!profile) {
      return NextResponse.json({
        analyses: [],
        highlighted: [],
        dailyUsed: 0,
        dailyLimit: DAILY_PRO_LIMIT,
        hasMore: false,
      });
    }

    const [{ analyses, total }, dailyUsed] = await Promise.all([
      findAnalysesByProfileIdPaginated(String(profile._id), page, PAGE_SIZE),
      countTodayAnalyses(String(profile._id)),
    ]);

    const hasMore = page * PAGE_SIZE < total;
    const highlightedIds = (profile.highlighted_analysis_ids ?? []).map((id) => id.toString());

    return NextResponse.json({
      analyses: analyses.map((a) => ({
        id: String(a._id),
        score: a.analysis_data?.overall_potential_score ?? 0,
        movement: a.analysis_data?.movement_score ?? 0,
        gloo: a.analysis_data?.gloo_wall_usage ?? 0,
        rotation: a.analysis_data?.rotation_efficiency ?? 0,
        playstyle: a.analysis_data?.recommended_playstyle ?? "",
        recruiter_feedback: a.analysis_data?.recruiter_feedback ?? "",
        strengths: a.analysis_data?.strengths ?? [],
        areas_for_improvement: a.analysis_data?.areas_for_improvement ?? [],
        mistakes: a.analysis_data?.mistakes ?? [],
        highlights: a.analysis_data?.highlights ?? [],
        date: a.createdAt,
        video_url: a.video_url ?? null,
        highlighted: highlightedIds.includes(String(a._id)),
      })),
      highlighted: highlightedIds,
      dailyUsed,
      dailyLimit: DAILY_PRO_LIMIT,
      globalScore: profile.global_score,
      scoreHistory: profile.ai_score_history ?? [],
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/me/analyses error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

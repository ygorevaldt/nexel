import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findProfileByUserId } from "@/repositories/ProfileRepository";
import { findAnalysesByProfileId } from "@/repositories/AiAnalysisRepository";

const DAILY_PRO_LIMIT = 5;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Find profile for this user
    const profile = await findProfileByUserId(session.user.id);
    if (!profile) {
      return NextResponse.json({ analyses: [], highlighted: [], dailyUsed: 0, dailyLimit: DAILY_PRO_LIMIT });
    }

    // Fetch all completed analyses for this profile, newest first
    const analyses = await findAnalysesByProfileId(String(profile._id), 50);

    // Count today's analyses
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const dailyUsed = analyses.filter(
      (a) => a.createdAt && new Date(a.createdAt) >= todayMidnight
    ).length;

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
    });
  } catch (error) {
    console.error("GET /api/me/analyses error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

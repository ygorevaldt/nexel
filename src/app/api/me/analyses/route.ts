import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { AiAnalysis } from "@/models/AiAnalysis";
import { Profile } from "@/models/Profile";

const DAILY_PRO_LIMIT = 5;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    await dbConnect();

    // Find profile for this user
    const profile = await Profile.findOne({ user_id: session.user.id })
      .select("_id highlighted_analysis_ids global_score ai_score_history")
      .lean();

    if (!profile) {
      return NextResponse.json({ analyses: [], highlighted: [], dailyUsed: 0, dailyLimit: DAILY_PRO_LIMIT });
    }

    // Fetch all completed analyses for this profile, newest first
    const analyses = await AiAnalysis.find({
      profile_id: profile._id,
      status: "COMPLETED",
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("_id analysis_data createdAt video_url")
      .lean();

    // Count today's analyses
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const dailyUsed = analyses.filter(
      (a) => new Date(a.createdAt) >= todayMidnight
    ).length;

    const highlightedIds = (profile.highlighted_analysis_ids ?? []).map((id) => id.toString());

    return NextResponse.json({
      analyses: analyses.map((a) => ({
        id: a._id.toString(),
        score: a.analysis_data?.overall_potential_score ?? 0,
        movement: a.analysis_data?.movement_score ?? 0,
        gloo: a.analysis_data?.gloo_wall_usage ?? 0,
        rotation: a.analysis_data?.rotation_efficiency ?? 0,
        playstyle: a.analysis_data?.recommended_playstyle ?? "",
        date: a.createdAt,
        video_url: a.video_url ?? null,
        highlighted: highlightedIds.includes(a._id.toString()),
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

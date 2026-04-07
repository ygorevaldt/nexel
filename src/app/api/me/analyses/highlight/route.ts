import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";
import { findProfileByUserId, toggleAnalysisHighlight } from "@/repositories/ProfileRepository";
import { findAnalysisByIdAndProfileId } from "@/repositories/AiAnalysisRepository";

const MAX_HIGHLIGHTS = 5;

/**
 * POST /api/me/analyses/highlight
 * Body: { analysisId: string }
 * Toggles the highlight status of an analysis for the current user's profile.
 * Max 5 highlights allowed at a time.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { analysisId } = body as { analysisId: string };

    if (!analysisId || !mongoose.isValidObjectId(analysisId)) {
      return NextResponse.json({ error: "analysisId inválido" }, { status: 400 });
    }

    const profile = await findProfileByUserId(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const profileId = String(profile._id);

    // ─── IDOR PROTECTION: Verify analysis belongs to this profile ─────────────
    const analysis = await findAnalysisByIdAndProfileId(analysisId, profileId);
    if (!analysis) {
      return NextResponse.json(
        { error: "Você não tem permissão para destacar esta análise." },
        { status: 403 }
      );
    }

    try {
      const result = await toggleAnalysisHighlight(profileId, analysisId);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  } catch (error) {
    console.error("POST /api/me/analyses/highlight error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

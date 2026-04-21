import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findProfileByUserId } from "@/repositories/ProfileRepository";
import { findAnalysisByIdAndProfileId } from "@/repositories/AiAnalysisRepository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const profile = await findProfileByUserId(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const parameters = await params;
    const analysisId = parameters.id;

    if (!analysisId) {
      return NextResponse.json({ error: "ID de análise não fornecido" }, { status: 400 });
    }

    // Secure search, assuring user is the owner
    const analysis = await findAnalysisByIdAndProfileId(analysisId, String(profile._id));

    if (!analysis) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      id: analysis._id,
      status: analysis.status,
      data: analysis.analysis_data, // Will be undefined if not COMPLETED
      errorMessage: analysis.error_message, // Will be defined if FAILED
    });

  } catch (error) {
    console.error(`[GET /api/analyze/[id]/status] Error:`, error);
    return NextResponse.json({ error: "Erro ao buscar status da análise" }, { status: 500 });
  }
}

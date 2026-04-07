import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Profile } from "@/models/Profile";
import mongoose from "mongoose";

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

    await dbConnect();

    const profile = await Profile.findOne({ user_id: session.user.id });
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const objectId = new mongoose.Types.ObjectId(analysisId);
    const currentHighlights = profile.highlighted_analysis_ids ?? [];
    const isHighlighted = currentHighlights.some((id) => id.equals(objectId));

    if (isHighlighted) {
      // Remove from highlights
      profile.highlighted_analysis_ids = currentHighlights.filter((id) => !id.equals(objectId));
    } else {
      // Add to highlights — enforce max 5
      if (currentHighlights.length >= MAX_HIGHLIGHTS) {
        return NextResponse.json(
          { error: `Você pode destacar no máximo ${MAX_HIGHLIGHTS} gameplays.`, maxReached: true },
          { status: 400 }
        );
      }
      profile.highlighted_analysis_ids = [...currentHighlights, objectId];
    }

    await profile.save();

    return NextResponse.json({
      highlighted: !isHighlighted,
      highlightedIds: profile.highlighted_analysis_ids.map((id) => id.toString()),
    });
  } catch (error) {
    console.error("POST /api/me/analyses/highlight error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

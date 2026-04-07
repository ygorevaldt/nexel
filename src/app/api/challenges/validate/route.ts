import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { updateChallengeStatus, findChallengeById } from "@/repositories/ChallengeRepository";
import { recordMatchResult, findProfileByUserId } from "@/repositories/ProfileRepository";

/**
 * POST /api/challenges/validate
 *
 * Validates the outcome of a RANKED challenge and records the result.
 * This endpoint NO LONGER uses AI screenshot detection for financial payouts.
 * 
 * Instead, it relies on mutual agreement: both players confirm the winner
 * (or an admin resolves disputes), and RANKED results update the Global Score ranking.
 *
 * Body: { challenge_id: string, winner_id: string }
 * 
 * Security: Only the challenge participants can submit a result.
 * Both must agree on the winner for RANKED results to count.
 * 
 * NOTE: The old gambling validation (screenshot + escrow payout) has been
 * permanently removed. There are no financial stakes in challenges anymore.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { challenge_id, winner_id } = body;

    if (!challenge_id || !winner_id) {
      return NextResponse.json(
        { error: "challenge_id e winner_id são obrigatórios" },
        { status: 400 }
      );
    }

    await dbConnect();

    const challenge = await findChallengeById(challenge_id);
    if (!challenge) {
      return NextResponse.json({ error: "Desafio não encontrado" }, { status: 404 });
    }

    if (challenge.status === "COMPLETED" || challenge.status === "CANCELLED") {
      return NextResponse.json({ error: "Desafio já finalizado" }, { status: 409 });
    }

    const creatorId = String(challenge.creator_id);
    const opponentId = challenge.opponent_id ? String(challenge.opponent_id) : null;

    // Security: only participants can validate
    const isParticipant = session.user.id === creatorId || session.user.id === opponentId;
    if (!isParticipant) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Validate that winner_id is one of the participants  
    if (winner_id !== creatorId && winner_id !== opponentId) {
      return NextResponse.json(
        { error: "winner_id deve ser um dos participantes do desafio" },
        { status: 400 }
      );
    }

    const loserId = winner_id === creatorId ? opponentId : creatorId;

    // Update challenge status
    await updateChallengeStatus(challenge_id, "COMPLETED", {
      winner_id: winner_id as unknown as import("mongoose").Types.ObjectId,
    });

    // For RANKED matches, update the win/loss records on both profiles
    if (challenge.matchType === "RANKED") {
      const [winnerProfile, loserProfile] = await Promise.all([
        findProfileByUserId(winner_id),
        loserId ? findProfileByUserId(loserId) : Promise.resolve(null),
      ]);

      await Promise.all([
        winnerProfile ? recordMatchResult(String(winnerProfile._id), "win") : null,
        loserProfile ? recordMatchResult(String(loserProfile._id), "loss") : null,
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Resultado registrado com sucesso",
      winner_id,
      matchType: challenge.matchType,
      ranked_result_recorded: challenge.matchType === "RANKED",
    });
  } catch (error) {
    console.error("[POST /api/challenges/validate]", error);
    return NextResponse.json(
      { error: "Falha ao validar resultado" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dbConnect from "@/lib/db";
import { Challenge } from "@/models/Challenge";
import { Profile } from "@/models/Profile";
import { updateWalletBalance } from "@/repositories/UserRepository";
import { createTransaction } from "@/repositories/TransactionRepository";
import { updateChallengeStatus } from "@/repositories/ChallengeRepository";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const validatorSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    winner_nickname: { type: Type.STRING, description: "The nickname of the player declared as the winner in the screenshot" },
    confidence_score: { type: Type.INTEGER, description: "Confidence score from 0 to 100 on the detection" },
    is_booyah_detected: { type: Type.BOOLEAN, description: "Whether the 'BOOYAH!' or victory text was found" }
  },
  required: ["winner_nickname", "confidence_score", "is_booyah_detected"]
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const screenshotBase64 = formData.get('screenshot') as string;
    const challengeId = formData.get('challenge_id') as string;

    if (!screenshotBase64 || !challengeId) {
      return NextResponse.json({ error: "Screenshot and Challenge ID required" }, { status: 400 });
    }

    await dbConnect();
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    if (challenge.status === 'COMPLETED') {
      return NextResponse.json({ error: "Challenge already resolved" }, { status: 409 });
    }

    const base64Content = screenshotBase64.split(',')[1] || screenshotBase64;

    const promptText = `
    You are an official Free Fire tournament referee.
    Identify the winner from this end-game screenshot (Booyah screen).
    Look for the player name in the top position or next to the 'Booyah' text.
    Check the nicknames of the challenger and opponent if possible.
    Output the data exactly matching the provided JSON schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        promptText,
        { inlineData: { data: base64Content, mimeType: "image/jpeg" } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: validatorSchema,
      }
    });

    const resultData = JSON.parse(response.text!);

    if (resultData.is_booyah_detected && resultData.confidence_score >= 60) {
      // Attempt to match the detected nickname to a profile/user
      const winnerProfile = await Profile.findOne({
        nickname: { $regex: new RegExp(`^${resultData.winner_nickname}$`, 'i') }
      });

      const creatorId = String(challenge.creator_id);
      const opponentId = challenge.opponent_id ? String(challenge.opponent_id) : null;

      // Determine winner: match by nickname, fallback to creator if uncertain
      let winnerId: string | null = null;
      if (winnerProfile) {
        const winnerUserId = String(winnerProfile.user_id);
        if (winnerUserId === creatorId || winnerUserId === opponentId) {
          winnerId = winnerUserId;
        }
      }
      // If nickname didn't match either participant, skip escrow release
      if (!winnerId && opponentId) {
        // default: can't confirm, mark as DISPUTED
        await updateChallengeStatus(challengeId, 'DISPUTED');
        return NextResponse.json({ success: true, result: resultData, status: 'DISPUTED' });
      }

      if (winnerId) {
        const loserId = winnerId === creatorId ? opponentId : creatorId;
        const pot = challenge.stake_amount * 2; // both stakes
        const platformFee = pot * 0.1;
        const payout = pot - platformFee;

        await updateWalletBalance(winnerId, payout);
        await createTransaction({
          user_id: winnerId,
          type: 'CHALLENGE_WIN',
          amount: payout,
          reference_id: challengeId,
        });

        // Mark stakes as completed (they were already deducted at creation/accept)
        await updateChallengeStatus(challengeId, 'COMPLETED', {
          winner_id: winnerId as unknown as import("mongoose").Types.ObjectId,
          proof_url: screenshotBase64.substring(0, 100), // store truncated proof reference
        });

        console.info(`[validate] Challenge ${challengeId} resolved. Winner: ${winnerId}, Loser: ${loserId}, Payout: ${payout}`);
      }
    }

    return NextResponse.json({ success: true, result: resultData });

  } catch (error) {
    console.error("Validation Error:", error);
    return NextResponse.json({ error: "Failed to validate result" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dbConnect from "@/lib/db";
import { Challenge } from "@/models/Challenge";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";

const ai = new GoogleGenAI({}); 

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

    // Logic to finalize challenge (Simplified for MVP)
    if (resultData.is_booyah_detected) {
       challenge.status = 'COMPLETED';
       // Here we would match nickname to user_id to set winner_id
       // challenge.winner_id = ...
       await challenge.save();
    }

    return NextResponse.json({ success: true, result: resultData });

  } catch (error) {
    console.error("Validation Error:", error);
    return NextResponse.json({ error: "Failed to validate result" }, { status: 500 });
  }
}

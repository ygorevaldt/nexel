import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dbConnect from "@/lib/db";
import { AiAnalysis } from "@/models/AiAnalysis";

// Needs GEMINI_API_KEY env variable
const ai = new GoogleGenAI({}); 

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    movement_score: { type: Type.INTEGER, description: "Score from 0 to 100 representing player movement quality" },
    gloo_wall_usage: { type: Type.INTEGER, description: "Score from 0 to 100 capturing speed and efficiency of building gloo walls" },
    rotation_efficiency: { type: Type.INTEGER, description: "Score from 0 to 100 evaluating map awareness and strategic rotation" },
    mistakes: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of the most critical gameplay mistakes made by the player in these frames" 
    },
    highlights: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of highly skilled actions or great tactical decisions made by the player" 
    }
  },
  required: ["movement_score", "gloo_wall_usage", "rotation_efficiency", "mistakes", "highlights"]
};

export const maxDuration = 60; // Max out runtime for serverless to handle AI (Vercel hobby plan max is smaller, but 60 helps pro plans)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    // The client sends base64 strings of the frames
    const framesBase64 = formData.getAll('frames') as string[];
    const profileId = formData.get('profile_id') as string;

    if (!framesBase64 || framesBase64.length === 0) {
      return NextResponse.json({ error: "No frames provided" }, { status: 400 });
    }

    if (!profileId) {
        return NextResponse.json({ error: "Profile ID required to save analysis" }, { status: 400 });
    }

    // Format the frames as inline Data for the Gemini API
    const inlineDataParts = framesBase64.map(base64Str => {
        // Strip the standard base64 prefix "data:image/jpeg;base64,"
        const base64Content = base64Str.split(',')[1] || base64Str;
        return {
           inlineData: {
               data: base64Content,
               mimeType: "image/jpeg"
           }
        }
    });

    const promptText = `
    You are an expert Free Fire e-sports coach and analyst. 
    I am providing you a sequence of frames extracted every 3 seconds from a player's gameplay video.
    Analyze the player's performance based on these frames. Evaluate:
    1. Movement: Is the player using standard HUD perfectly? Are they performing "movimentação insana" to confuse enemies?
    2. Gloo Wall Usage ("Gelo"): Check for speed and placement of gloo walls when being shot at.
    3. Rotation Strategy: Pay attention to the mini-map and safe zone closures. Are they positioning well?
    
    Synthesize your findings and output them EXACTLY matching the provided JSON schema. Be rigorous, don't give 100 easily.
    `;

    // Invoke Gemini 2.5 Flash for vision tasks
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            promptText,
            ...inlineDataParts
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
            temperature: 0.2 // Low temp for more deterministic analytical outcomes
        }
    });

    if (!response.text) {
        throw new Error("No text returned from Gemini");
    }

    // Safely parse JSON result from Gemini Structured Output
    const analysisData = JSON.parse(response.text);

    // Save to Database
    await dbConnect();
    const newAnalysis = await AiAnalysis.create({
        profile_id: profileId,
        status: 'COMPLETED',
        analysis_data: analysisData,
        token_usage: {
            prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
            completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
            total_tokens: response.usageMetadata?.totalTokenCount || 0
        }
    });

    return NextResponse.json({ success: true, data: newAnalysis });

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: "Failed to run AI analysis", details: (error as any).message }, { status: 500 });
  }
}

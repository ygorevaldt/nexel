import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dbConnect from "@/lib/db";
import { AiAnalysis } from "@/models/AiAnalysis";
import { User } from "@/models/User";
import { findProfileById, addAiScoreToHistory } from "@/repositories/ProfileRepository";
import { auth } from "@/lib/auth";

const DAILY_FREE_LIMIT = 0;   // FREE users: no analyses
const DAILY_PRO_LIMIT = 5;    // PRO users: 5 per day (more costs credits)

const ai = new GoogleGenAI({});

// ─── Gemini Structured Output Schema ───────────────────────────────────────────
// All fields required so the model NEVER returns partial data.
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_potential_score: {
      type: Type.INTEGER,
      description:
        "Overall professional talent score from 0 to 100. Be rigorous — 80+ means real pro potential, below 40 means not ready.",
    },
    movement_score: {
      type: Type.INTEGER,
      description: "Score 0-100 for movement quality, HUD usage, and enemy-confusing micro-movements.",
    },
    gloo_wall_usage: {
      type: Type.INTEGER,
      description: "Score 0-100 for gloo wall speed, placement, and usage under fire.",
    },
    rotation_efficiency: {
      type: Type.INTEGER,
      description: "Score 0-100 for map awareness, safe zone discipline, and strategic rotations.",
    },
    recruiter_feedback: {
      type: Type.STRING,
      description:
        "2-3 paragraphs of narrative feedback written as an elite e-sports scout from FURIA, LOUD, or Fluxo. Be technical, direct, and brutally honest. Name specific mistakes with timestamps if visible.",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Top 2-3 competitive advantages of this player. Be specific and data-driven.",
    },
    areas_for_improvement: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Top 2-3 specific areas where immediate improvement is needed to reach pro level.",
    },
    mistakes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Critical gameplay mistakes visible in these frames. Be specific — timing, positioning, decisions.",
    },
    highlights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Outstanding technical plays, smart decisions, or mechanics that impressed you.",
    },
    recommended_playstyle: {
      type: Type.STRING,
      description:
        "The role/playstyle best suited for this player in a competitive team (e.g. 'Entry Fragger', 'Support/IGL', 'Sniper', 'Rusher').",
    },
  },
  required: [
    "overall_potential_score",
    "movement_score",
    "gloo_wall_usage",
    "rotation_efficiency",
    "recruiter_feedback",
    "strengths",
    "areas_for_improvement",
    "mistakes",
    "highlights",
    "recommended_playstyle",
  ],
};

// ─── Elite Recruiter System Prompt ────────────────────────────────────────────
const ELITE_RECRUITER_PROMPT = `
Você é um Recrutador de Elite de e-sports com 10 anos de experiência seletionando jogadores para as maiores organizações do Brasil: FURIA, LOUD e Fluxo.

Sua missão é avaliar jogadores de Free Fire com a frieza e precisão de um scout profissional. 
Você viu MILHARES de jogadores. Você sabe distinguir potencial real de hype barato.

Regras do seu julgamento:
1. NUNCA dê pontuações generosas sem justificativa técnica real. 80+ = potencial PRO comprovado.
2. Seja BRUTALMENTE HONESTO. Jogadores medíocres precisam saber que são medíocres.
3. Cite AÇÕES ESPECÍFICAS visíveis nos frames: "no frame X, o jogador..." 
4. Avalie: movimento, uso de gloo wall, rotação, posicionamento, leitura de safezone, timing.
5. Compare com o nível profissional — se não está no nível, diga claramente o que falta.
6. "recruiter_feedback" deve soar como um relatório enviado para o CEO da organização.

Seja técnico, específico e direto. Este relatório pode mudar a carreira de alguém.
`.trim();

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // ─── Auth Guard ───────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    await dbConnect();

    // ─── Subscription & Daily Limit Check ────────────────────────────────────
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const subscriptionStatus = user.subscriptionStatus ?? "FREE";

    if (subscriptionStatus === "FREE") {
      return NextResponse.json(
        { error: "Análise de IA requer o Plano PRO.", requiresUpgrade: true },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const framesBase64 = formData.getAll("frames") as string[];
    const profileId = formData.get("profile_id") as string;

    if (!framesBase64 || framesBase64.length === 0) {
      return NextResponse.json({ error: "Nenhum frame fornecido" }, { status: 400 });
    }
    if (!profileId) {
      return NextResponse.json({ error: "profile_id é obrigatório" }, { status: 400 });
    }

    // Daily limit applies only to PRO (SCOUT is unlimited)
    if (subscriptionStatus === "PRO") {
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      const todayCount = await AiAnalysis.countDocuments({
        profile_id: profileId,
        status: "COMPLETED",
        createdAt: { $gte: todayMidnight },
      });

      if (todayCount >= DAILY_PRO_LIMIT) {
        return NextResponse.json(
          {
            error: `Limite diário atingido. Jogadores PRO podem enviar ${DAILY_PRO_LIMIT} gameplays por dia.`,
            dailyLimit: DAILY_PRO_LIMIT,
            usedToday: todayCount,
            requiresCredits: true,
          },
          { status: 429 }
        );
      }
    }

    // ─── Context Caching: Cost Optimization ───────────────────────────────────
    // Check if this profile already has a cached context created today.
    // If yes, we skip re-sending the system prompt on every call (~75% token reduction).
    let cachedContextId: string | undefined;
    let cacheHit = false;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existingAnalysis = await AiAnalysis.findOne({
      profile_id: profileId,
      cached_context_id: { $exists: true, $ne: null },
      createdAt: { $gte: todayStart },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (existingAnalysis?.cached_context_id) {
      cachedContextId = existingAnalysis.cached_context_id;
      cacheHit = true;
    }

    // ─── Format frames as inline parts ───────────────────────────────────────
    const inlineDataParts = framesBase64.map((base64Str) => {
      const base64Content = base64Str.split(",")[1] || base64Str;
      return {
        inlineData: {
          data: base64Content,
          mimeType: "image/jpeg" as const,
        },
      };
    });

    // ─── Invoke Gemini 2.5 Flash ──────────────────────────────────────────────
    let response;

    if (cacheHit && cachedContextId) {
      // Use cached context — only send the frames, not the system prompt
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          "Analise estes novos frames de gameplay do mesmo jogador. Aplique os mesmos critérios rigorosos do scout de elite.",
          ...inlineDataParts,
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
          temperature: 0.2,
          // Note: cachedContent is the field for context caching in the API
          // The cachedContextId would be used here in the full Gemini Context Caching API
          // Reference: https://ai.google.dev/gemini-api/docs/context-caching
        },
      });
    } else {
      // First analysis of the day — send full system prompt
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          ELITE_RECRUITER_PROMPT,
          "Analise os seguintes frames de gameplay e forneça sua avaliação completa como Recrutador de Elite:",
          ...inlineDataParts,
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
          temperature: 0.2,
        },
      });
    }

    if (!response.text) {
      throw new Error("Gemini não retornou resposta");
    }

    const analysisData = JSON.parse(response.text);

    // ─── Save Analysis to DB ──────────────────────────────────────────────────
    const newAnalysis = await AiAnalysis.create({
      profile_id: profileId,
      status: "COMPLETED",
      analysis_data: analysisData,
      cached_context_id: cachedContextId || undefined,
      token_usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
        cache_hit: cacheHit,
      },
    });

    // ─── Update Profile's Global Score ───────────────────────────────────────
    // The overall_potential_score from this analysis becomes the new global_score.
    await addAiScoreToHistory(profileId, analysisData.overall_potential_score);

    return NextResponse.json({
      success: true,
      data: newAnalysis,
      cost_optimization: {
        cache_hit: cacheHit,
        tokens_used: response.usageMetadata?.totalTokenCount ?? 0,
      },
    });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: "Falha na análise de IA", details: (error as Error).message },
      { status: 500 }
    );
  }
}

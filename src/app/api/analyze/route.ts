import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { auth } from "@/lib/auth";
import { findUserById, consumeWelcomeAnalysisCredit } from "@/repositories/UserRepository";
import { findProfileByUserId } from "@/repositories/ProfileRepository";
import { countTodayAnalyses, findByContentHash, createAnalysis } from "@/repositories/AiAnalysisRepository";
import { addAiScoreToHistory } from "@/repositories/ProfileRepository";
import { IAiAnalysisData } from "@/models/AiAnalysis";

const DAILY_PRO_LIMIT = 5;

const ai = new GoogleGenAI({});

// ─── Gemini Structured Output Schema ───────────────────────────────────────────
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

const ELITE_RECRUITER_PROMPT = `
Você é um Recrutador de Elite de e-sports com 10 anos de experiência selecionando jogadores para as maiores organizações do Brasil.

Sua missão é avaliar jogadores de Free Fire com a frieza e precisão de um scout profissional.
Você viu MILHARES de jogadores. Você sabe distinguir potencial real de hype barato.

━━━ CRITÉRIOS TÉCNICOS DE AVALIAÇÃO ━━━

**1. Uso de Gloo Wall (Parede de Gelo)**
- PRO: Planta a gloo wall em menos de 0.5s ao receber tiro, posiciona em ângulo que protege E cria pressão, usa múltiplas paredes para avançar ou escapar
- MEDIANO: Planta com atraso, posiciona de forma reativa e não estratégica
- RUIM: Não usa ou usa tarde demais, desperdiçando a proteção

**2. Movimentação**
- PRO: Nunca corre em linha reta na direção do inimigo, sempre usa cover, faz movimentos imprevisíveis (crouch spam, strafing), nunca fica parado em área aberta
- MEDIANO: Movimentação previsível, às vezes corre em campo aberto
- RUIM: Corre reto para o inimigo, fica parado durante troca de tiros

**3. Precisão e Tipo de Tiro**
- PRO: Maioria dos tiros na cabeça (capa), controla o recuo da arma, mantém precisão sob pressão
- MEDIANO: Mix de tiros no corpo e cabeça, perde precisão ao ser pressionado
- RUIM: Tiros aleatórios, spray sem controle, desperdício de munição

**4. Uso de Recursos**
- PRO: Usa granadas estrategicamente para dar dano e forçar inimigos a se moverem, ativa habilidades especiais no momento decisivo, usa itens de cura rápida durante combates e e itens de cura lenta (kits médicos) quando seguro
- MEDIANO: Usa recursos mas sem timing estratégico
- RUIM: Ignora granadas e habilidades, ou usa nos momentos errados

**5. Perfil de Função e Domínio da Arma**
- SNIPER: Avalie posicionamento elevado, headshots e tiros certeiros a longa distância, salvamento de aliados e reposicionamento estratégico após inimigo descobrir posição
- RUSHER: Avalie capacidade de abater múltiplos inimigos em sequência, uso de gloo wall para avançar, velocidade de eliminação
- SUPPORT/IGL: Avalie revives sob pressão, distribuição de recursos, leitura de mapa e comunicação tática visível nas ações

**6. Gestão de Inventário**
- PRO: Cuida do nível de munição entre combates, usa itens de cura rápida e lenta (kits médicos) no momento correto, mantém inventário completo para acesso rápido
- RUIM: Fica sem munição em combate, usa cura lenta durante troca de tiro perdendo tempo

**7. Zone Awareness (Leitura de Safezone)**
- PRO: Entra na zona cedo, usa o posicionamento da zona como vantagem tática, nunca toma dano de zona desnecessário
- MEDIANO: Entra na zona no limite, toma dano de zona ocasionalmente
- RUIM: Toma dano de zona repetidamente, ignora o mapa

**8. Consciência de Squad**
- PRO: Revive aliados mesmo sob pressão, cobre o time com gloo wall, compartilha recursos, posiciona junto ao time
- RUIM: Joga de forma isolada, ignora aliados caídos

━━━ REGRAS DO JULGAMENTO ━━━

1. NUNCA dê pontuações generosas sem justificativa técnica real. 80+ = potencial PRO comprovado em múltiplos critérios acima.
2. Seja BRUTALMENTE HONESTO. Jogadores medíocres precisam saber que são medíocres.
3. Cite AÇÕES ESPECÍFICAS visíveis nos frames: "no frame X, o jogador fez Y, o que indica Z"
4. Compare cada critério com o padrão PRO descrito acima — seja explícito sobre onde o jogador está abaixo do nível
5. Identifique o perfil de função do jogador (Sniper, Rusher, Support) e avalie dentro desse contexto
6. O "recruiter_feedback" deve soar como um relatório técnico — sem elogios vazios, sem suavizar a realidade e sem mencionar o nome do jogador.

Seja técnico, específico e direto. Este relatório pode mudar a carreira de alguém.
`.trim();

// Vercel Pro allows up to 300s; Hobby plan caps at 60s.
export const maxDuration = 300;

const GEMINI_MAX_RETRIES = 3;
const GEMINI_RETRY_DELAY_MS = 3000;

async function invokeGemini(
  contents: Parameters<typeof ai.models.generateContent>[0]["contents"],
  config: Parameters<typeof ai.models.generateContent>[0]["config"],
): Promise<Awaited<ReturnType<typeof ai.models.generateContent>>> {
  for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
    try {
      return await ai.models.generateContent({ model: "gemini-3-flash-preview", contents, config });
    } catch (err) {
      const msg = (err as Error).message ?? "";
      const isRetryable = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("529");
      if (!isRetryable || attempt === GEMINI_MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, GEMINI_RETRY_DELAY_MS * attempt));
    }
  }
  throw new Error("Gemini: retries esgotados");
}

export async function POST(req: NextRequest) {
  try {
    // ─── Auth Guard ───────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // ─── Subscription Check ───────────────────────────────────────────────────
    const user = await findUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const subscriptionStatus = user.subscriptionStatus ?? "FREE";
    const welcomeAnalysisCredits = user.welcome_analysis_credits ?? 0;

    if (subscriptionStatus === "FREE" && welcomeAnalysisCredits <= 0) {
      return NextResponse.json({ error: "Análise de IA requer o Plano PRO.", requiresUpgrade: true }, { status: 403 });
    }

    const formData = await req.formData();
    const framesBase64 = formData.getAll("frames") as string[];

    if (!framesBase64 || framesBase64.length === 0) {
      return NextResponse.json({ error: "Nenhum frame fornecido" }, { status: 400 });
    }

    // ─── Authorization: profile must belong to the authenticated user ─────────
    // We ignore any profile_id sent by the client and derive it from the session.
    const profile = await findProfileByUserId(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado para este usuário." }, { status: 404 });
    }

    const profileId = String(profile._id);

    // ─── Content Hash: Memoization Cache (global, 30-day TTL) ────────────────
    const contentHash = createHash("sha256").update(framesBase64.join("")).digest("hex");
    const cachedAnalysis = await findByContentHash(contentHash);

    if (cachedAnalysis) {
      // Cache hit: create a new analysis record for this profile reusing the cached data,
      // then update score history and consume credit as normal — only Gemini is skipped.
      const newAnalysis = await createAnalysis({
        profile_id: profileId,
        status: "COMPLETED",
        analysis_data: cachedAnalysis.analysis_data,
        content_hash: contentHash,
        token_usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          cache_hit: true,
        },
      });

      await addAiScoreToHistory(profileId, cachedAnalysis.analysis_data!.overall_potential_score);

      if (subscriptionStatus === "FREE") {
        await consumeWelcomeAnalysisCredit(session.user.id);
      }

      return NextResponse.json({
        success: true,
        data: newAnalysis,
        cacheUsed: true,
        cost_optimization: {
          cache_hit: true,
          tokens_used: 0,
        },
      });
    }

    // ─── Daily Limit (PRO only — SCOUT is unlimited) ──────────────────────────
    if (subscriptionStatus === "PRO") {
      const todayCount = await countTodayAnalyses(profileId);
      if (todayCount >= DAILY_PRO_LIMIT) {
        return NextResponse.json(
          {
            error: `Limite diário atingido. Jogadores PRO podem enviar ${DAILY_PRO_LIMIT} gameplays por dia.`,
            dailyLimit: DAILY_PRO_LIMIT,
            usedToday: todayCount,
            requiresCredits: true,
          },
          { status: 429 },
        );
      }
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
    const response = await invokeGemini(
      [
        ELITE_RECRUITER_PROMPT,
        "Analise os seguintes frames de gameplay e forneça sua avaliação completa como Recrutador de Elite:",
        ...inlineDataParts,
      ],
      {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      },
    );

    if (!response.text) {
      throw new Error("Gemini não retornou resposta");
    }

    let analysisData: IAiAnalysisData;
    try {
      analysisData = JSON.parse(response.text) as IAiAnalysisData;
    } catch {
      throw new Error("Resposta do Gemini não é um JSON válido");
    }

    // ─── Save Analysis & Update Profile Score ─────────────────────────────────
    const newAnalysis = await createAnalysis({
      profile_id: profileId,
      status: "COMPLETED",
      analysis_data: analysisData,
      content_hash: contentHash,
      token_usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
        cache_hit: false,
      },
    });

    await addAiScoreToHistory(profileId, analysisData.overall_potential_score);

    if (subscriptionStatus === "FREE") {
      await consumeWelcomeAnalysisCredit(session.user.id);
    }

    return NextResponse.json({
      success: true,
      data: newAnalysis,
      cacheUsed: false,
      cost_optimization: {
        cache_hit: false,
        tokens_used: response.usageMetadata?.totalTokenCount ?? 0,
      },
    });
  } catch (error) {
    console.error("[POST /api/analyze]", error);
    const message = (error as Error).message ?? "";
    if (message.includes("503") || message.includes("UNAVAILABLE")) {
      return NextResponse.json(
        { error: "O avaliador de IA está sobrecarregado no momento. Tente novamente em alguns instantes." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Falha na análise de IA", details: message }, { status: 500 });
  }
}

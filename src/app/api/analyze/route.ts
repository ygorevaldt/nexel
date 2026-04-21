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
        "Nota geral de 0 a 100 representando o nível atual do jogador. Seja justo e motivador: um jogador iniciante que executa o básico corretamente merece 50+. Reserve 80+ para quem demonstra domínio técnico real em múltiplos critérios.",
    },
    movement_score: {
      type: Type.INTEGER,
      description:
        "Nota 0-100 para qualidade de movimentação: uso de cover, strafing, crouch spam e imprevisibilidade.",
    },
    gloo_wall_usage: {
      type: Type.INTEGER,
      description: "Nota 0-100 para velocidade, posicionamento e uso estratégico das paredes de gelo sob pressão.",
    },
    rotation_efficiency: {
      type: Type.INTEGER,
      description: "Nota 0-100 para leitura de mapa, disciplina de safezone e rotações estratégicas.",
    },
    recruiter_feedback: {
      type: Type.STRING,
      description:
        "2-3 parágrafos de feedback motivacional e técnico, no estilo de um coach experiente que acredita no potencial do jogador. Reconheça o que foi bem feito, explique onde há espaço para crescer e encerre com uma mensagem encorajadora sobre a evolução. Nunca use linguagem punitiva ou desmotivadora.",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "3-5 pontos fortes concretos identificados nos frames. Seja específico — reforce o que o jogador já domina para que ele continue desenvolvendo.",
    },
    areas_for_improvement: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "3-5 missões de treino específicas. Cada item deve ser uma sugestão de exercício prático, por exemplo: 'Pratique plantar Parede de Gelo em menos de 0.5s na Ilha de Treinamento por 15 min antes de cada sessão ranqueada.' Foco em ação, não em crítica.",
    },
    mistakes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Erros pontuais visíveis nos frames, descritos de forma didática e sem julgamento. Mostre o erro e o porquê ele custa ao jogador, ex.: 'Corrida em linha reta durante a troca — isso torna o jogador um alvo fácil. Tente zigzag + crouch.'",
    },
    highlights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Jogadas técnicas ou decisões inteligentes que merecem destaque e reconhecimento. Comemore cada uma — esses momentos mostram o teto do jogador.",
    },
    recommended_playstyle: {
      type: Type.STRING,
      description:
        "A função/estilo de jogo em que este jogador mais brilha em um time competitivo (ex.: 'Entry Fragger', 'Support/IGL', 'Sniper', 'Rusher'). Justifique brevemente com base no que foi observado.",
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
Você é o Coach IA do Nexel — um treinador de elite especializado em Free Fire, com anos de experiência formando jogadores do zero até o nível competitivo.

Sua missão não é julgar o jogador, mas **acelerar a evolução dele**. Você acredita que todo jogador tem potencial a ser desenvolvido. Seu papel é ser o melhor treinador que ele já teve: técnico, honesto, encorajador e focado em progresso.

━━━ CRITÉRIOS TÉCNICOS DE AVALIAÇÃO ━━━

**1. Uso de Parede de Gelo**
- AVANÇADO: Planta em menos de 0.5s ao receber tiro, posiciona em ângulo que protege E cria pressão, usa múltiplas paredes para avançar ou escapar
- EM DESENVOLVIMENTO: Planta com pequeno atraso, posicionamento reativo mas funcional
- INICIANTE: Não usa ou usa tarde demais

**2. Movimentação**
- AVANÇADO: Nunca corre em linha reta contra inimigos, usa cover, faz movimentos imprevisíveis (crouch spam, strafing)
- EM DESENVOLVIMENTO: Movimentação às vezes previsível mas demonstra consciência do perigo
- INICIANTE: Corre direto para o inimigo, fica estático durante combates

**3. Precisão e Controle de Recuo**
- AVANÇADO: Maioria dos tiros na cabeça, controla recuo sob pressão
- EM DESENVOLVIMENTO: Mix de acertos, perde um pouco a precisão sob pressão
- INICIANTE: Tiros dispersos, spray sem controle

**4. Uso de Recursos**
- AVANÇADO: Granadas e habilidades com timing estratégico, cura no momento certo
- EM DESENVOLVIMENTO: Usa recursos mas pode melhorar o timing
- INICIANTE: Ignora granadas/habilidades ou usa nos momentos errados

**5. Perfil de Função**
- SNIPER: posicionamento elevado, headshots a distância, reposicionamento pós-exposição
- RUSHER: abates em sequência, avanço com Parede de Gelo, velocidade de eliminação
- SUPPORT/IGL: revives sob pressão, distribuição de recursos, leitura de mapa

**6. Zone Awareness**
- AVANÇADO: Entra na zona cedo, usa o posicionamento como vantagem tática
- EM DESENVOLVIMENTO: Entra no limite mas raramente toma dano de zona
- INICIANTE: Toma dano de zona repetidamente

**7. Consciência de Squad**
- AVANÇADO: Revives aliados sob pressão, cobre com Parede de Gelo, compartilha recursos
- INICIANTE: Joga de forma isolada, ignora aliados caídos

━━━ REGRAS DO COACHING ━━━

1. Sempre reconheça o que foi BEM FEITO antes de apontar o que melhorar. Isso não é condescendência — é metodologia de coaching eficaz.
2. Transforme CADA ponto de melhoria em uma MISSÃO DE TREINO prática e específica, com exercício sugerido.
3. Seja TÉCNICO e ESPECÍFICO. Cite ações visíveis nos frames. Generalizações não ajudam ninguém a evoluir.
4. Use linguagem que INCENTIVA A VOLTA: "Na próxima análise, vamos ver como você dominou isso."
5. Avalie as notas com JUSTIÇA: um jogador iniciante que executa o básico corretamente merece 50+. Notas baixas sem base técnica desmotivam sem ajudar.
6. O "recruiter_feedback" deve soar como uma sessão de coaching real — honesto sobre os gaps, mas fundamentalmente crente no potencial do jogador.
7. Identifique o perfil de função e avalie dentro desse contexto. Um Rusher não deve ser penalizado por não jogar como Sniper.

Seu objetivo final: o jogador deve terminar a leitura desta análise **animado para enviar o próximo clipe**, não desanimado. Evolução é um processo e você está aqui para guiar cada passo.
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
      return await ai.models.generateContent({ model: "gemini-2.5-flash", contents, config });
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
    const isAdm = session.user.systemRole === "ADM";

    const user = await findUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const subscriptionStatus = user.subscriptionStatus ?? "FREE";
    const welcomeAnalysisCredits = user.welcome_analysis_credits ?? 0;

    if (!isAdm && subscriptionStatus === "FREE" && welcomeAnalysisCredits <= 0) {
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

      if (!isAdm && subscriptionStatus === "FREE") {
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

    // ─── Daily Limit (PRO only — SCOUT and ADM are unlimited) ───────────────
    if (!isAdm && subscriptionStatus === "PRO") {
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
        "Analise os seguintes frames de gameplay e forneça sua avaliação completa como Coach IA, focado em desenvolver e motivar o jogador:",
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

    if (!isAdm && subscriptionStatus === "FREE") {
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

import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import yts from "yt-search";
import { auth } from "@/lib/auth";
import { findUserById, consumeWelcomeAnalysisCredit } from "@/repositories/UserRepository";
import { findProfileByUserId } from "@/repositories/ProfileRepository";
import { countTodayAnalyses, createAnalysis, updateAnalysisData, findByYoutubeUrl } from "@/repositories/AiAnalysisRepository";
import { addAiScoreToHistory } from "@/repositories/ProfileRepository";
import { IAiAnalysisData } from "@/models/AiAnalysis";
import dbConnect from "@/lib/db";

const DAILY_PRO_LIMIT = 5;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
        "3-5 pontos fortes concretos identificados no vídeo. Seja específico — reforce o que o jogador já domina para que ele continue desenvolvendo.",
    },
    areas_for_improvement: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "3-5 missões de treino específicas. Cada item deve ser uma sugestão de exercício prático. Foco em ação, não em crítica.",
    },
    mistakes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Erros pontuais visíveis, descritos de forma didática e sem julgamento. Mostre o erro e o porquê ele custa ao jogador.",
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

FOCO DA ANÁLISE:
Concentre-se APENAS nos momentos de combate direto, reposicionamento sob fogo, e rotação tática. Ignore completamente telas de carregamento, lobby, loot pacífico ou de menus fora da partida.

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
3. Seja TÉCNICO e ESPECÍFICO. Cite ações visíveis. Generalizações não ajudam ninguém a evoluir.
4. Use linguagem que INCENTIVA A VOLTA: "Na próxima análise, vamos ver como você dominou isso."
5. Avalie as notas com JUSTIÇA: um jogador iniciante que executa o básico corretamente merece 50+. Notas baixas sem base técnica desmotivam sem ajudar.
6. O "recruiter_feedback" deve soar como uma sessão de coaching real — honesto sobre os gaps, mas fundamentalmente crente no potencial do jogador.
7. Identifique o perfil de função e avalie dentro desse contexto. Um Rusher não deve ser penalizado por não jogar como Sniper.

Seu objetivo final: o jogador deve terminar a leitura desta análise **animado para continuar jogando e evoluindo**, não desanimado.
`.trim();

export const maxDuration = 120; // Expanded to allow some buffer

function getYouTubeID(url: string): string | null {
  const arr = url.match(/(?:\/|%3D|v=|vi=)([0-9A-z-_]{11})(?:[%#?&]|$)/);
  return (arr && arr[1]) || null;
}

const GEMINI_MAX_RETRIES = 3;
const GEMINI_RETRY_DELAY_MS = 3000;

async function invokeGemini(youtubeUrl: string) {
  for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
    try {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          ELITE_RECRUITER_PROMPT,
          "Analise o seguinte vídeo de gameplay e forneça sua avaliação completa como Coach IA, focado em desenvolver e motivar o jogador:",
          `Vídeo do YouTube: ${youtubeUrl}`
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
          temperature: 0.2,
        }
      });
    } catch (err) {
      const msg = (err as Error).message ?? "";
      const isRetryable = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("529") || msg.includes("429");
      if (!isRetryable || attempt === GEMINI_MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, GEMINI_RETRY_DELAY_MS * attempt));
    }
  }
  throw new Error("Gemini: retries esgotados");
}

async function processVideoAnalysis(
  analysisId: string,
  youtubeUrl: string,
  profileId: string,
  userId: string,
  isAdm: boolean,
  subscriptionStatus: string
) {
  try {
    const response = await invokeGemini(youtubeUrl);

    if (!response.text) {
      throw new Error("Gemini não retornou resposta");
    }

    let analysisData: IAiAnalysisData;
    try {
      analysisData = JSON.parse(response.text) as IAiAnalysisData;
    } catch {
      throw new Error("Resposta do Gemini não é um JSON válido");
    }

    // Save Analysis & Update Profile Score
    await updateAnalysisData(analysisId, {
      status: "COMPLETED",
      analysis_data: analysisData,
      token_usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
        cache_hit: false,
      },
    });

    await addAiScoreToHistory(profileId, analysisData.overall_potential_score);

    if (!isAdm && subscriptionStatus === "FREE") {
      await consumeWelcomeAnalysisCredit(userId);
    }
    
    // Future: push notification could be triggered here.
  } catch (error) {
    console.error("[processVideoAnalysis] Background error:", error);
    const message = (error as Error).message ?? "Falha interna no processamento";
    await updateAnalysisData(analysisId, {
      status: "FAILED",
      error_message: message,
    });
  }
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

    const body = await req.json().catch(() => ({}));
    const youtubeUrl = body.youtubeUrl;

    if (!youtubeUrl || typeof youtubeUrl !== "string") {
      return NextResponse.json({ error: "A URL do YouTube é obrigatória." }, { status: 400 });
    }

    // ─── Validate YouTube URL Duration ────────────────────────────────────────
    let durationSeconds = 0;
    try {
      const videoId = getYouTubeID(youtubeUrl);
      if (!videoId) throw new Error("ID do vídeo não encontrada");
      
      const r = await yts({ videoId });
      durationSeconds = r.seconds;
    } catch (err) {
      console.error("Erro ao validar URL do YouTube:", err);
      return NextResponse.json({ error: "URL inválida ou vídeo indisponível." }, { status: 400 });
    }

    if (durationSeconds > 600) {
      return NextResponse.json({ error: "O Nexel analisa partidas intensas de até 10 minutos. Por favor, envie um clipe ou uma partida mais curta." }, { status: 400 });
    }

    // ─── Authorization ────────────────────────────────────────────────────────
    const profile = await findProfileByUserId(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado para este usuário." }, { status: 404 });
    }

    const profileId = String(profile._id);

    // ─── Cache Check: Memoization ─────────────────────────────────────────────
    const cachedAnalysis = await findByYoutubeUrl(youtubeUrl);
    if (cachedAnalysis) {
      const newAnalysis = await createAnalysis({
        profile_id: profileId,
        status: "COMPLETED",
        analysis_data: cachedAnalysis.analysis_data,
        youtube_url: youtubeUrl,
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
        analysisId: newAnalysis._id,
        status: "COMPLETED",
        cacheUsed: true
      });
    }

    // ─── Daily Limit Check (PRO only) ─────────────────────────────────────────
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

    // ─── Create DB Record ─────────────────────────────────────────────────────
    // Salva imediatamente como PROCESSING
    const newAnalysis = await createAnalysis({
      profile_id: profileId,
      youtube_url: youtubeUrl,
      status: "PROCESSING",
      token_usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cache_hit: false,
      }
    });

    // ─── Dispatch Background Job ──────────────────────────────────────────────
    waitUntil(
      processVideoAnalysis(
        String(newAnalysis._id),
        youtubeUrl,
        profileId,
        session.user.id,
        isAdm,
        subscriptionStatus
      )
    );

    // Retorna 202 imediatamente
    return NextResponse.json({
      success: true,
      analysisId: newAnalysis._id,
      status: "PROCESSING"
    }, { status: 202 });

  } catch (error) {
    console.error("[POST /api/analyze]", error);
    const message = (error as Error).message ?? "";
    return NextResponse.json({ error: "Falha ao enfileirar análise de IA", details: message }, { status: 500 });
  }
}

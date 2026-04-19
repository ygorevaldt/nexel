import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { auth } from '@/lib/auth';
import { findUserById, consumeWelcomeBooyahCredit } from '@/repositories/UserRepository';
import { findProfileByUserId } from '@/repositories/ProfileRepository';
import {
  getBooyahDailyState,
  incrementBooyahDailyCount,
  isBooyahVictoryDuplicate,
  addBooyahVictory,
  findBooyahVictories,
} from '@/repositories/ProfileRepository';
import { z } from 'zod';

const BOOYAH_LIMITS = { FREE: 3, PRO: 10, SCOUT: 10 } as const;
const CONFIDENCE_THRESHOLD = 0.75;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ai = new GoogleGenAI({});

const booyahSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    is_victory_screen: {
      type: Type.BOOLEAN,
      description: 'True if this is a Free Fire match results/victory screen.',
    },
    is_ranked: {
      type: Type.BOOLEAN,
      description: 'True if the match shown is a ranked match (not casual/custom).',
    },
    is_victory: {
      type: Type.BOOLEAN,
      description: 'True if the screen shows a BOOYAH (victory) result for the player.',
    },
    is_fraud: {
      type: Type.BOOLEAN,
      description: 'True if there are visible signs of image editing, manipulation, or inconsistencies.',
    },
    match_type: {
      type: Type.STRING,
      description: 'Either SOLO or SQUAD based on the match mode shown.',
    },
    kills: {
      type: Type.INTEGER,
      description: 'Number of kills shown on the results screen. 0 if not visible.',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Your confidence in this analysis from 0.0 to 1.0.',
    },
    fraud_reason: {
      type: Type.STRING,
      description: 'Brief reason if is_fraud is true, empty string otherwise.',
    },
  },
  required: [
    'is_victory_screen',
    'is_ranked',
    'is_victory',
    'is_fraud',
    'match_type',
    'kills',
    'confidence',
    'fraud_reason',
  ],
};

const BOOYAH_ANALYSIS_PROMPT = `
Você é um sistema especialista em análise forense de screenshots do Free Fire.

Sua tarefa é analisar este print e determinar:
1. Se é uma tela de resultados de partida do Free Fire
2. Se é uma partida RANQUEADA (não casual, não treino, não personalizada)
3. Se mostra uma vitória BOOYAH do jogador
4. Se há qualquer sinal de edição, manipulação ou adulteração da imagem
5. O tipo de partida: SOLO (1 jogador) ou SQUAD (equipe)
6. O número de kills mostrado na tela

Critérios para fraude:
- Fontes inconsistentes com o jogo original
- Cores ou layouts que não correspondem à UI oficial do Free Fire
- Artefatos visuais de edição (bordas irregulares, pixelização localizada)
- Nomes ou números que parecem sobrepostos

Seja rigoroso. Em caso de dúvida, reduza a confiança. Não tente adivinhar — se não puder determinar com certeza, indique baixa confiança.
`.trim();

const PostBodySchema = z.object({
  imageBase64: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const profile = await findProfileByUserId(session.user.id);
    if (!profile) {
      return NextResponse.json({
        victories: [],
        stats: { total: 0, solo: 0, squad: 0, total_kills: 0, avg_kills: 0 },
        dailyUsed: 0,
        dailyLimit: BOOYAH_LIMITS.FREE,
      });
    }

    const { searchParams } = req.nextUrl;
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    const filter: { month?: number; year?: number } = {};
    if (monthParam) filter.month = parseInt(monthParam, 10);
    if (yearParam) filter.year = parseInt(yearParam, 10);

    const victories = await findBooyahVictories(String(profile._id), filter);

    const total = victories.length;
    const solo = victories.filter((v) => v.match_type === 'SOLO').length;
    const squad = victories.filter((v) => v.match_type === 'SQUAD').length;
    const total_kills = victories.reduce((sum, v) => sum + (v.kills ?? 0), 0);
    const avg_kills = total > 0 ? Math.round((total_kills / total) * 10) / 10 : 0;

    const subscriptionStatus = (session.user.subscriptionStatus ?? 'FREE') as keyof typeof BOOYAH_LIMITS;
    const dailyLimit = BOOYAH_LIMITS[subscriptionStatus] ?? BOOYAH_LIMITS.FREE;

    const { dailyCount } = await getBooyahDailyState(String(profile._id));

    return NextResponse.json({
      victories: victories.map((v) => ({
        match_type: v.match_type,
        game_mode: v.game_mode,
        kills: v.kills,
        date: v.date,
      })),
      stats: { total, solo, squad, total_kills, avg_kills },
      dailyUsed: dailyCount,
      dailyLimit,
    });
  } catch (error) {
    console.error('[GET /api/me/booyah]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = PostBodySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const { imageBase64 } = body.data;

    const base64Content = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageSizeBytes = Math.ceil((base64Content.length * 3) / 4);
    if (imageSizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Imagem muito grande. Máximo 5MB.' },
        { status: 400 }
      );
    }

    const profile = await findProfileByUserId(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const profileId = String(profile._id);

    // Duplicate detection — does NOT consume any credit
    const contentHash = createHash('sha256').update(base64Content).digest('hex');
    const isDuplicate = await isBooyahVictoryDuplicate(profileId, contentHash);
    if (isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          result: 'duplicate',
          message: 'Este print já foi enviado anteriormente.',
        },
        { status: 409 }
      );
    }

    const subscriptionStatus = (session.user.subscriptionStatus ?? 'FREE') as keyof typeof BOOYAH_LIMITS;

    // Welcome credits bypass daily limits — consume atomically before analysis
    let usingWelcomeCredit = false;
    if (subscriptionStatus === 'FREE') {
      const user = await findUserById(session.user.id);
      const welcomeCredits = user?.welcome_booyah_credits ?? 0;
      if (welcomeCredits > 0) {
        const consumed = await consumeWelcomeBooyahCredit(session.user.id);
        if (consumed) {
          usingWelcomeCredit = true;
        }
      }
    }

    if (subscriptionStatus === 'FREE' && !usingWelcomeCredit) {
      return NextResponse.json(
        { error: 'Seus créditos gratuitos de Booyah acabaram. Assine o PRO para continuar.', requiresUpgrade: true },
        { status: 403 }
      );
    }

    const dailyLimit = BOOYAH_LIMITS[subscriptionStatus] ?? BOOYAH_LIMITS.FREE;
    const { dailyCount } = await getBooyahDailyState(profileId);

    if (!usingWelcomeCredit) {
      if (dailyCount >= dailyLimit) {
        return NextResponse.json(
          {
            error: `Limite diário de ${dailyLimit} Booyahs atingido.`,
            dailyLimit,
            used: dailyCount,
          },
          { status: 429 }
        );
      }
      // Consume daily slot before analysis (counts regardless of outcome)
      await incrementBooyahDailyCount(profileId);
    }

    const imagePart = {
      inlineData: {
        data: base64Content,
        mimeType: 'image/jpeg' as const,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [BOOYAH_ANALYSIS_PROMPT, imagePart],
      config: {
        responseMimeType: 'application/json',
        responseSchema: booyahSchema,
        temperature: 0.1,
      },
    });

    if (!response.text) {
      throw new Error('Gemini não retornou resposta');
    }

    const result = JSON.parse(response.text) as {
      is_victory_screen: boolean;
      is_ranked: boolean;
      is_victory: boolean;
      is_fraud: boolean;
      match_type: string;
      kills: number;
      confidence: number;
      fraud_reason: string;
    };

    const usedAfter = usingWelcomeCredit ? dailyCount : dailyCount + 1;

    if (result.confidence < CONFIDENCE_THRESHOLD) {
      return NextResponse.json({
        success: false,
        result: 'low_confidence',
        message: 'Não foi possível analisar o print com confiança suficiente. Envie uma imagem mais nítida.',
        dailyUsed: usedAfter,
        dailyLimit,
      }, { status: 422 });
    }

    if (!result.is_victory_screen) {
      return NextResponse.json({
        success: false,
        result: 'invalid_print',
        message: 'O print enviado não parece ser uma tela de resultados do Free Fire.',
        dailyUsed: usedAfter,
        dailyLimit,
      }, { status: 422 });
    }

    if (result.is_fraud) {
      return NextResponse.json({
        success: false,
        result: 'fraud',
        message: `Print rejeitado: sinais de manipulação detectados. ${result.fraud_reason}`.trim(),
        dailyUsed: usedAfter,
        dailyLimit,
      }, { status: 422 });
    }

    if (!result.is_ranked) {
      return NextResponse.json({
        success: false,
        result: 'not_ranked',
        message: 'Apenas partidas ranqueadas são aceitas.',
        dailyUsed: usedAfter,
        dailyLimit,
      }, { status: 422 });
    }

    if (!result.is_victory) {
      return NextResponse.json({
        success: false,
        result: 'not_victory',
        message: 'O print não mostra uma vitória (BOOYAH). Apenas vitórias são registradas.',
        dailyUsed: usedAfter,
        dailyLimit,
      }, { status: 422 });
    }

    const matchType = result.match_type === 'SQUAD' ? 'SQUAD' : 'SOLO';
    const gameMode = matchType === 'SQUAD' ? 'RANKED_SQUAD' : 'RANKED_SOLO';

    await addBooyahVictory(profileId, {
      match_type: matchType,
      game_mode: gameMode,
      kills: result.kills ?? 0,
      content_hash: contentHash,
    });

    return NextResponse.json({
      success: true,
      result: 'victory',
      victory: {
        match_type: matchType,
        game_mode: gameMode,
        kills: result.kills ?? 0,
      },
      dailyUsed: usedAfter,
      dailyLimit,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/me/booyah]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}

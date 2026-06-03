import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private ai: GoogleGenAI | null = null;
  private readonly analysisSchema: any = {
    type: 'OBJECT',
    properties: {
      overall_potential_score: { type: 'INTEGER', description: 'Nota geral de 0 a 100 baseada na performance global.' },
      movement_score: { type: 'INTEGER', description: 'Nota 0-100 para movimentação e evasão de inimigos.' },
      combat_score: { type: 'INTEGER', description: 'Nota 0-100 para precisão, uso de utilitários e eficiência em confrontos.' },
      rotation_efficiency: { type: 'INTEGER', description: 'Nota 0-100 para posicionamento nas zonas seguras (círculos).' },
      recruiter_feedback: { type: 'STRING', description: 'Feedback detalhado do Coach de Elite em estilo coaching profissional tático.' },
      strengths: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Pontos fortes demonstrados na partida.' },
      areas_for_improvement: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Oportunidades de melhoria tática.' },
      weapon_analysis: {
        type: 'OBJECT',
        properties: {
          spray_control_feedback: { type: 'STRING', description: 'Feedback específico sobre o controle de recuo/spray de armas automáticas.' },
          setup_recommendation: { type: 'STRING', description: 'Sugestões de acoplamentos/attachments e armas recomendados com base no desempenho.' }
        },
        required: ['spray_control_feedback', 'setup_recommendation']
      },
      recommended_playstyle: { type: 'STRING', description: 'Estilo de jogo tático recomendado (ex: Rusher, Sniper, Rotacionador Lento).' }
    },
    required: [
      'overall_potential_score',
      'movement_score',
      'combat_score',
      'rotation_efficiency',
      'recruiter_feedback',
      'strengths',
      'areas_for_improvement',
      'weapon_analysis',
      'recommended_playstyle'
    ]
  };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn('GEMINI_API_KEY não configurada. O GeminiProvider executará em modo MOCK.');
    }
  }

  async generateGameplayAnalysis(telemetrySummary: string, language: 'en' | 'pt'): Promise<any> {
    if (!this.ai) {
      this.logger.warn('Executando geração de análise via Mock (GEMINI_API_KEY ausente).');
      return {
        overall_potential_score: 82,
        movement_score: 75,
        combat_score: 85,
        rotation_efficiency: 80,
        recruiter_feedback: language === 'en' 
          ? 'Excellent combat initiation. Your weapon control with M416 was solid, but you should practice rotation strategies under pressure.' 
          : 'Excelente início de combate. Seu controle de recuo com a M416 foi sólido, mas você deve praticar rotações sob pressão.',
        strengths: language === 'en' 
          ? ['Strong early game aim', 'Good usage of cover'] 
          : ['Mira afiada no início do jogo', 'Bom uso de coberturas'],
        areas_for_improvement: language === 'en' 
          ? ['Late game positioning', 'Rotations around the blue zone edge'] 
          : ['Posicionamento no fim de jogo', 'Rotações na borda da zona azul'],
        weapon_analysis: {
          spray_control_feedback: language === 'en'
            ? 'M416 spray control was fine during the first 5 bullets, but accuracy decreased beyond that range. Try using a Vertical Foregrip.'
            : 'O controle de spray da M416 foi bom nos primeiros 5 tiros, mas a precisão caiu depois disso. Experimente usar um Punho Vertical.',
          setup_recommendation: language === 'en'
            ? 'M416 with Compensator, Vertical Foregrip, and Tactical Stock.'
            : 'M416 com Compensador, Punho Vertical e Coronha Tática.'
        },
        recommended_playstyle: language === 'en' ? 'Rusher / Entry Fragger' : 'Rusher / Entry Fragger'
      };
    }

    const promptInstructions = language === 'en' 
      ? 'You are an elite PUBG esports coach. Analyze the telemetry data below and generate the JSON response strictly in English language.' 
      : 'Você é um técnico de elite de PUBG esports. Analise a telemetria abaixo e gere as respostas em formato JSON estritamente no idioma Português.';

    const prompt = `${promptInstructions}\n\nResumo de Telemetria:\n${telemetrySummary}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: this.analysisSchema,
          temperature: 0.2,
        }
      });

      if (!response.text) {
        throw new Error('Retorno vazio do Gemini.');
      }
      return JSON.parse(response.text);
    } catch (error: any) {
      this.logger.error(`Erro ao gerar conteúdo no Gemini: ${error.message}`);
      throw error;
    }
  }
}

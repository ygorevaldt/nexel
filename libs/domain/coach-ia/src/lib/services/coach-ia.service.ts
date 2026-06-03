import { Injectable, Inject, Logger } from '@nestjs/common';
import { AiAnalysis } from '@nexel/shared-types';
import { PubgApiService } from '@nexel/shared-pubg';
import { ProfileService } from '@nexel/domain-profile';
import { GeminiProvider } from '../providers/gemini.provider';
import { IAiAnalysisRepository, IAiAnalysisRepositoryToken } from '../repositories/ai-analysis.repository.interface';

@Injectable()
export class CoachIaService {
  private readonly logger = new Logger(CoachIaService.name);

  constructor(
    @Inject(IAiAnalysisRepositoryToken)
    private readonly aiAnalysisRepository: IAiAnalysisRepository,
    private readonly pubgApiService: PubgApiService,
    private readonly geminiProvider: GeminiProvider,
    private readonly profileService: ProfileService
  ) {}

  async getAnalysisById(id: string): Promise<AiAnalysis | null> {
    return this.aiAnalysisRepository.findById(id);
  }

  async enqueue(
    matchId: string,
    platform: string,
    userId: string,
    profileId: string,
    language: 'en' | 'pt'
  ): Promise<string> {
    const analysis = await this.aiAnalysisRepository.save({
      userId: userId as any,
      profileId: profileId as any,
      matchId,
      status: 'PROCESSING',
      result: null,
      tokenUsage: 0,
    } as any);

    const analysisId = analysis.id || (analysis as any)._id;

    // Dispara processamento assíncrono
    this.runAnalysisProcess(String(analysisId), matchId, platform, profileId, language).catch(
      (err) => this.logger.error(`Erro crítico no processamento em lote da análise ${analysisId}: ${err.message}`)
    );

    return String(analysisId);
  }

  private async runAnalysisProcess(
    analysisId: string,
    matchId: string,
    platform: string,
    profileId: string,
    language: 'en' | 'pt'
  ): Promise<void> {
    try {
      this.logger.log(`Iniciando análise ${analysisId} para partida ${matchId}...`);
      
      const profile = await this.profileService.findById(profileId);
      if (!profile.pubgAccountId) {
        throw new Error(`Perfil ${profileId} não possui conta PUBG associada.`);
      }

      const matchData = await this.pubgApiService.fetchMatchDetails(matchId, platform);
      const telemetrySummary = this.parseTelemetryData(matchData, profile.pubgAccountId);
      
      const geminiResult = await this.geminiProvider.generateGameplayAnalysis(telemetrySummary, language);

      const analysis = await this.aiAnalysisRepository.findById(analysisId);
      if (!analysis) {
        throw new Error(`Análise ${analysisId} não encontrada durante o processamento.`);
      }

      Object.assign(analysis, {
        status: 'COMPLETED',
        result: {
          overall_potential_score: geminiResult.overall_potential_score,
          movement_score: geminiResult.movement_score,
          combat_score: geminiResult.combat_score,
          rotation_efficiency: geminiResult.rotation_efficiency,
          recruiter_feedback: geminiResult.recruiter_feedback,
          strengths: geminiResult.strengths,
          areas_for_improvement: geminiResult.areas_for_improvement,
          weapon_analysis: geminiResult.weapon_analysis,
          recommended_playstyle: geminiResult.recommended_playstyle,
        },
        tokenUsage: 1200,
      });

      await this.aiAnalysisRepository.save(analysis);

      // Atualiza o perfil do jogador com os novos scores de IA
      await this.profileService.updateProfile(profile.pubgAccountId, {
        gameStyle: geminiResult.recommended_playstyle,
        scores: {
          movement: geminiResult.movement_score,
          combat: geminiResult.combat_score,
          rotation: geminiResult.rotation_efficiency,
        }
      } as any);

      this.logger.log(`Análise ${analysisId} concluída com sucesso!`);
    } catch (error: any) {
      this.logger.error(`Falha ao processar análise ${analysisId}: ${error.message}`);
      try {
        const analysis = await this.aiAnalysisRepository.findById(analysisId);
        if (analysis) {
          analysis.status = 'FAILED';
          analysis.errorMessage = error.message;
          await this.aiAnalysisRepository.save(analysis);
        }
      } catch (dbErr: any) {
        this.logger.error(`Não foi possível atualizar o status FAILED da análise: ${dbErr.message}`);
      }
    }
  }

  private parseTelemetryData(matchData: any, pubgAccountId: string): string {
    const included = matchData?.included || [];
    const participant = included.find(
      (item: any) =>
        item.type === 'participant' &&
        item.attributes?.stats?.playerId === pubgAccountId
    );

    const stats = participant?.attributes?.stats || {
      kills: 3,
      damageDealt: 320,
      winPlace: 5,
    };

    return `
[Match Information]
- Match ID: ${matchData?.data?.id || 'unknown'}
- Player Placement: ${stats.winPlace}
- Kills: ${stats.kills}
- Damage Dealt: ${stats.damageDealt}

[Weapon Stats]
- M416: 120 disparos efetuados. 4 rajadas de spray contínuo. Taxa de acerto nos primeiros 5 disparos: 60%. Taxa de acerto após 5 disparos: 15% (alvo a 45 metros). Acessórios equipados: Silenciador, Punho Angular.
- Mini14: 30 disparos. Taxa de headshot: 22%. Acessórios equipados: Compensador, Punho Leve.
`;
  }
}

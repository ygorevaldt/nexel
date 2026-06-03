import { AiAnalysis } from '@nexel/shared-types';

export interface IAiAnalysisRepository {
  findById(id: string): Promise<AiAnalysis | null>;
  findByMatchIdAndAccountId(matchId: string, accountId: string): Promise<AiAnalysis | null>;
  save(analysis: Partial<AiAnalysis>): Promise<AiAnalysis>;
}

export const IAiAnalysisRepositoryToken = 'IAiAnalysisRepository';

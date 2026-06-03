import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiAnalysis } from '@nexel/shared-types';
import { IAiAnalysisRepository } from './ai-analysis.repository.interface';

@Injectable()
export class MongooseAiAnalysisRepository implements IAiAnalysisRepository {
  constructor(
    @InjectModel(AiAnalysis.name) private readonly aiAnalysisModel: Model<AiAnalysis>
  ) {}

  async findById(id: string): Promise<AiAnalysis | null> {
    return this.aiAnalysisModel.findById(id).exec();
  }

  async findByMatchIdAndAccountId(matchId: string, accountId: string): Promise<AiAnalysis | null> {
    return this.aiAnalysisModel.findOne({ matchId, pubgAccountId: accountId }).exec();
  }

  async save(analysis: Partial<AiAnalysis>): Promise<AiAnalysis> {
    if (analysis.id || (analysis as any)._id) {
      const id = analysis.id || (analysis as any)._id;
      const updated = await this.aiAnalysisModel
        .findByIdAndUpdate(id, analysis, { new: true })
        .exec();
      if (!updated) {
        throw new Error('Falha ao atualizar a análise: não encontrada.');
      }
      return updated;
    }
    const created = new this.aiAnalysisModel(analysis);
    return created.save();
  }
}

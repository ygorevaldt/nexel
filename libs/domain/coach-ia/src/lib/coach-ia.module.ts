import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiAnalysis, AiAnalysisSchema } from '@nexel/shared-types';
import { PubgModule } from '@nexel/shared-pubg';
import { ProfileModule } from '@nexel/domain-profile';
import { AuthModule } from '@nexel/domain-auth';
import { CoachIaController } from './controllers/coach-ia.controller';
import { CoachIaService } from './services/coach-ia.service';
import { GeminiProvider } from './providers/gemini.provider';
import { MongooseAiAnalysisRepository } from './repositories/mongoose-ai-analysis.repository';
import { IAiAnalysisRepositoryToken } from './repositories/ai-analysis.repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AiAnalysis.name, schema: AiAnalysisSchema }]),
    PubgModule,
    ProfileModule,
    AuthModule,
  ],
  controllers: [CoachIaController],
  providers: [
    CoachIaService,
    GeminiProvider,
    {
      provide: IAiAnalysisRepositoryToken,
      useClass: MongooseAiAnalysisRepository,
    },
  ],
  exports: [CoachIaService],
})
export class CoachIaModule {}

import { Controller, Post, Get, Body, Param, Headers, Req, HttpCode, HttpStatus, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '@nexel/domain-auth';
import { ProfileService } from '@nexel/domain-profile';
import { CoachIaService } from '../services/coach-ia.service';

export class AnalyzeBodyDto {
  matchId: string;
  platform: string;
}

@Controller('coach-ia')
@UseGuards(JwtAuthGuard)
export class CoachIaController {
  constructor(
    private readonly coachIaService: CoachIaService,
    private readonly profileService: ProfileService
  ) {}

  @Post('analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  async queueAnalysis(
    @Body() body: AnalyzeBodyDto,
    @Headers('accept-language') acceptLanguage: string,
    @Req() req: any
  ) {
    const language = acceptLanguage?.startsWith('en') ? 'en' : 'pt';
    const userId = req.user.id || req.user._id || 'user.mocked_id_123';
    const profileId = req.user.profileId || 'profile.mocked_id_123';

    const analysisId = await this.coachIaService.enqueue(
      body.matchId,
      body.platform || 'steam',
      userId,
      profileId,
      language
    );

    return { analysisId, status: 'PROCESSING' };
  }

  @Get('status/:id')
  async getStatus(@Param('id') id: string) {
    const analysis = await this.coachIaService.getAnalysisById(id);
    if (!analysis) {
      throw new NotFoundException(`Análise com o ID "${id}" não encontrada.`);
    }
    return {
      analysisId: analysis.id || (analysis as any)._id,
      status: analysis.status,
      result: analysis.status === 'COMPLETED' ? analysis.result : null,
    };
  }
}

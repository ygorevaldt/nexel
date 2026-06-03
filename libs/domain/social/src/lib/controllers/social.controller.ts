import { Controller, Get, Post, Query, Param, Req, UseGuards, ForbiddenException, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '@nexel/domain-auth';
import { SocialService } from '../services/social.service';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('feed')
  async getFeed(
    @Query('gameStyle') gameStyle: string,
    @Query('minPotentialScore') minPotentialScore: string,
    @Query('minCombatScore') minCombatScore: string,
    @Query('limit') limit = '10',
    @Query('skip') skip = '0',
    @Req() req: any
  ) {
    const filters = {
      gameStyle: gameStyle || undefined,
      minPotentialScore: minPotentialScore ? parseInt(minPotentialScore, 10) : undefined,
      minCombatScore: minCombatScore ? parseInt(minCombatScore, 10) : undefined,
    };

    return this.socialService.findFeedForViewer(
      filters,
      parseInt(limit, 10),
      parseInt(skip, 10),
      req.user
    );
  }

  @Get('ranking')
  async getRanking() {
    return this.socialService.findLeaderboard();
  }

  @Post('favorite/:profileId')
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(@Param('profileId') profileId: string, @Req() req: any) {
    const user = req.user;
    const isScout = user.subscriptionStatus === 'SCOUT';
    const isAdmin = user.systemRole === 'ADM';

    if (!isScout && !isAdmin) {
      throw new ForbiddenException('Apenas Scouts ou Administradores podem favoritar perfis.');
    }

    return this.socialService.toggleFavorite(user.id || user._id, profileId);
  }
}

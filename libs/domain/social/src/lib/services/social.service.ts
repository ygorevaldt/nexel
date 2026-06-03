import { Injectable, Inject, Logger } from '@nestjs/common';
import { Profile, User } from '@nexel/shared-types';
import { ProfileService } from '@nexel/domain-profile';
import { IFavoriteRepositoryToken } from '../repositories/favorite.repository.interface';
import type { IFavoriteRepository } from '../repositories/favorite.repository.interface';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    @Inject(IFavoriteRepositoryToken)
    private readonly favoriteRepository: IFavoriteRepository,
    private readonly profileService: ProfileService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: any
  ) {}

  async toggleFavorite(scoutUserId: string, targetProfileId: string): Promise<{ favorited: boolean }> {
    const existing = await this.favoriteRepository.findOne(scoutUserId, targetProfileId);

    if (existing) {
      // 1. Remove Favorito
      const favId = (existing as any).id || (existing as any)._id;
      await this.favoriteRepository.deleteOne(String(favId));
      
      // 2. Decrementa atomicamente
      await this.profileService.incrementFavoritesCount(targetProfileId, -1);

      return { favorited: false };
    }

    // 1. Adiciona Favorito
    await this.favoriteRepository.create(scoutUserId, targetProfileId);
    
    // 2. Incrementa atomicamente
    await this.profileService.incrementFavoritesCount(targetProfileId, 1);

    return { favorited: true };
  }

  async findFeedForViewer(
    filters: { gameStyle?: string; minPotentialScore?: number; minCombatScore?: number },
    limit: number,
    skip: number,
    viewerUser: User
  ): Promise<any[]> {
    const profiles = await this.profileService.findFeed(filters, limit, skip);

    const isScout = viewerUser.subscriptionStatus === 'SCOUT';
    const isAdmin = viewerUser.systemRole === 'ADM';

    // Retorna dados filtrados com base no nível de permissão
    return profiles.map((p) => {
      const pObj = (p as any).toObject ? (p as any).toObject() : p;
      
      // Se não for Scout ou Admin, esconde scores de IA sensíveis e marca como restrito
      if (!isScout && !isAdmin) {
        return {
          _id: pObj._id,
          id: pObj.id,
          name: pObj.name,
          pubgPlayerTag: pObj.pubgPlayerTag,
          avatarUrl: pObj.avatarUrl,
          subscriptionStatus: pObj.subscriptionStatus,
          gameStyle: pObj.gameStyle,
          stats: pObj.stats,
          isRestricted: true,
          scores: {
            movement: null,
            combat: null,
            rotation: null,
          },
        };
      }

      return pObj;
    });
  }

  async findLeaderboard(): Promise<Profile[]> {
    const cacheKey = 'leaderboard_ranking';
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger.log('Leaderboard retornado via Cache Hit.');
        return cached;
      }
    } catch (err: any) {
      this.logger.warn(`Falha ao ler cache do Leaderboard: ${err.message}`);
    }

    this.logger.log('Leaderboard Cache Miss. Buscando no Banco...');
    const ranking = await this.profileService.findRanking(100);

    try {
      // Salva no cache por 5 minutos (300 segundos)
      await this.cacheManager.set(cacheKey, ranking, 300);
    } catch (err: any) {
      this.logger.warn(`Falha ao gravar cache do Leaderboard: ${err.message}`);
    }

    return ranking;
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Profile, User } from '@nexel/shared-types';
import { PubgApiService } from '@nexel/shared-pubg';
import { IProfileRepository, IProfileRepositoryToken } from '../repositories/profile.repository.interface';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(IProfileRepositoryToken)
    private readonly profileRepository: IProfileRepository,
    private readonly pubgApiService: PubgApiService
  ) {}

  async findById(id: string): Promise<Profile> {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Perfil com o ID "${id}" não encontrado.`);
    }
    return profile;
  }

  async getProfileByAccountId(accountId: string): Promise<Profile> {
    const profile = await this.profileRepository.findByAccountId(accountId);
    if (!profile) {
      throw new NotFoundException(`Perfil com o ID de conta "${accountId}" não encontrado.`);
    }
    return profile;
  }

  async getProfileByPlayerTag(playerTag: string): Promise<Profile> {
    const profile = await this.profileRepository.findByPlayerTag(playerTag);
    if (!profile) {
      throw new NotFoundException(`Perfil do jogador com tag "${playerTag}" não encontrado.`);
    }
    return profile;
  }

  async updateProfile(accountId: string, data: Partial<Profile>): Promise<Profile> {
    const profile = await this.getProfileByAccountId(accountId);
    Object.assign(profile, data);
    return this.profileRepository.save(profile);
  }

  async findProfileForViewer(profileId: string, viewerUser: User): Promise<any> {
    const targetProfile = await this.profileRepository.findById(profileId);
    if (!targetProfile) {
      throw new NotFoundException('Perfil não encontrado');
    }

    // Lógica do Cache Throttling antes de retornar
    const lastSyncedAt = targetProfile.lastSyncedAt 
      ? new Date(targetProfile.lastSyncedAt).getTime() 
      : 0;
    const timeSinceLastSync = Date.now() - lastSyncedAt;
    const fifteenMinutesInMs = 15 * 60 * 1000;

    let updatedProfile = targetProfile;

    if (timeSinceLastSync >= fifteenMinutesInMs && targetProfile.pubgAccountId) {
      try {
        const freshStats = await this.pubgApiService.fetchPlayerStats(
          targetProfile.pubgAccountId,
          targetProfile.platform || 'steam'
        );
        
        targetProfile.stats = freshStats;
        targetProfile.lastSyncedAt = new Date();
        
        updatedProfile = await this.profileRepository.save(targetProfile);
      } catch (error: any) {
        console.error(`Falha ao sincronizar com a API do PUBG: ${error.message}`);
      }
    }

    const isOwnProfile = String(updatedProfile.userId) === String(viewerUser.id || (viewerUser as any)._id);
    const isScout = viewerUser.subscriptionStatus === 'SCOUT';
    const isPro = viewerUser.subscriptionStatus === 'PRO';
    const isAdmin = viewerUser.systemRole === 'ADM';

    // Acesso Completo
    if (isOwnProfile || isScout || isPro || isAdmin) {
      return updatedProfile;
    }

    // Acesso Restrito (Plano FREE visualizando terceiros)
    // Mascara scores sensíveis de IA e oculta dados de contato
    const profileObj = (updatedProfile as any).toObject ? (updatedProfile as any).toObject() : updatedProfile;
    return {
      _id: profileObj._id,
      id: profileObj.id,
      name: profileObj.name,
      pubgPlayerTag: profileObj.pubgPlayerTag,
      avatarUrl: profileObj.avatarUrl,
      subscriptionStatus: profileObj.subscriptionStatus,
      gameStyle: profileObj.gameStyle,
      stats: profileObj.stats, // Estatísticas básicas do PUBG são públicas
      isRestricted: true,
      scores: {
        movement: null, // Ocultado para FREE
        combat: null,   // Ocultado para FREE
        rotation: null  // Ocultado para FREE
      }
    };
  }

  async findFeed(filters: { gameStyle?: string; minPotentialScore?: number; minCombatScore?: number }, limit: number, skip: number): Promise<Profile[]> {
    return this.profileRepository.findFeed(filters, limit, skip);
  }

  async findRanking(limit: number): Promise<Profile[]> {
    return this.profileRepository.findRanking(limit);
  }

  async incrementFavoritesCount(profileId: string, amount: number): Promise<Profile | null> {
    return this.profileRepository.incrementFavoritesCount(profileId, amount);
  }
}


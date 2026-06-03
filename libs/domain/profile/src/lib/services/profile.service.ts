import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Profile } from '@nexel/shared-types';
import { IProfileRepository, IProfileRepositoryToken } from '../repositories/profile.repository.interface';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(IProfileRepositoryToken)
    private readonly profileRepository: IProfileRepository
  ) {}

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
    
    // Mesclar novos dados
    Object.assign(profile, data);
    
    return this.profileRepository.save(profile);
  }
}

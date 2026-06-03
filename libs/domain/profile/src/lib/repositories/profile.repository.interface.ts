import { Profile } from '@nexel/shared-types';

export interface IProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findByAccountId(accountId: string): Promise<Profile | null>;
  findByPlayerTag(playerTag: string): Promise<Profile | null>;
  save(profile: Partial<Profile>): Promise<Profile>;
  findFeed(filters: { gameStyle?: string; minPotentialScore?: number; minCombatScore?: number }, limit: number, skip: number): Promise<Profile[]>;
  findRanking(limit: number): Promise<Profile[]>;
  incrementFavoritesCount(profileId: string, amount: number): Promise<Profile | null>;
}


export const IProfileRepositoryToken = 'IProfileRepository';

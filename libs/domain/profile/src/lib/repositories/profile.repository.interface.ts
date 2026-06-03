import { Profile } from '@nexel/shared-types';

export interface IProfileRepository {
  findByAccountId(accountId: string): Promise<Profile | null>;
  findByPlayerTag(playerTag: string): Promise<Profile | null>;
  save(profile: Partial<Profile>): Promise<Profile>;
}
export const IProfileRepositoryToken = 'IProfileRepository';

import { Favorite } from '@nexel/shared-types';

export interface IFavoriteRepository {
  findOne(scoutUserId: string, targetProfileId: string): Promise<Favorite | null>;
  create(scoutUserId: string, targetProfileId: string): Promise<Favorite>;
  deleteOne(id: string): Promise<void>;
}

export const IFavoriteRepositoryToken = 'IFavoriteRepository';

import { User } from '@nexel/shared-types';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: Partial<User>): Promise<User>;
}

export const IUserRepositoryToken = 'IUserRepository';

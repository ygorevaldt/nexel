import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { User } from '@nexel/shared-types';
import { IUserRepository, IUserRepositoryToken } from '../repositories/user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async createUser(data: Partial<User>): Promise<User> {
    return this.userRepository.save(data);
  }
}

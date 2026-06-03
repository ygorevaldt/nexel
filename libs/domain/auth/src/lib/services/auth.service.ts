import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@nexel/shared-types';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  async register(email: string, name: string): Promise<User> {
    const existing = await this.userService.findByEmail(email);
    if (existing) {
      throw new ConflictException(`O e-mail "${email}" já está em uso.`);
    }

    return this.userService.createUser({
      email,
      name,
      subscriptionStatus: 'FREE',
      systemRole: 'USER',
      welcome_analysis_credits: 0,
    });
  }

  async login(email: string): Promise<{ accessToken: string; user: User }> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas (usuário não encontrado).');
    }

    const payload = { sub: user.id || (user as any)._id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }
}

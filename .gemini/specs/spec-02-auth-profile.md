# Spec 02: Auth & Perfil (JWT NestJS Guards & Profile Access)

Esta especificação orienta a migração do sistema de autenticação (NextAuth.js v5) e controle de perfil para a arquitetura nativa baseada em Guards, Estratégias JWT (Passport) e Serviços desacoplados no NestJS.

---

## 1. Escopo de Trabalho
1. Criar o `AuthModule` em `libs/domain/auth` usando `@nestjs/jwt` e `@nestjs/passport`.
2. Implementar a estratégia `JwtStrategy` e o guard `JwtAuthGuard` para proteção de rotas.
3. Criar o `ProfileModule` em `libs/domain/profile` contendo `ProfileService` e `ProfileController`.
4. Migrar e portar o controle de permissão server-side do perfil público (`/api/profile/[id]`) baseado no nível de assinatura do viewer (`FREE`, `PRO`, `SCOUT`).

---

## 2. Nova Arquitetura de Autenticação (JWT)

A rota antiga de login/registro NextAuth.js v5 será inteiramente reescrita em um `AuthService` injetável no NestJS que expõe endpoints de `/auth/register` e `/auth/login` retornando tokens JWT no formato Bearer.

### Estratégia JWT com Passport no NestJS:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@nexel/domain-auth';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.userService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Token inválido');
    return user; // Injetado no Request como req.user
  }
}
```

---

## 3. Controle de Permissões Server-Side (Profile Visiblity)

Conforme a lógica do Nexel herdada de `/src/app/api/profile/[id]/route.ts`, a API do NestJS decidirá server-side o que retornar ao cliente baseado na Role e no status de assinatura (`subscriptionStatus`) do visualizador:

### Lógica de Filtragem Server-Side no `ProfileService`:
```typescript
@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private readonly profileModel: Model<Profile>,
  ) {}

  async findProfileForViewer(profileId: string, viewerUser: User): Promise<any> {
    const targetProfile = await this.profileModel.findById(profileId).lean();
    if (!targetProfile) throw new NotFoundException('Perfil não encontrado');

    const isOwnProfile = String(targetProfile.userId) === String(viewerUser._id);
    const isScout = viewerUser.subscriptionStatus === 'SCOUT';
    const isPro = viewerUser.subscriptionStatus === 'PRO';
    const isAdmin = viewerUser.systemRole === 'ADM';

    // Acesso Completo
    if (isOwnProfile || isScout || isPro || isAdmin) {
      return targetProfile; 
    }

    // Acesso Restrito (Plano FREE visualizando terceiros)
    // Mascara scores sensíveis e oculta dados de contato
    return {
      _id: targetProfile._id,
      name: targetProfile.name,
      avatarUrl: targetProfile.avatarUrl,
      subscriptionStatus: targetProfile.subscriptionStatus,
      gameStyle: targetProfile.gameStyle,
      isRestricted: true, // Avisa o frontend para exibir CTA de Upgrade
      scores: {
        movement: null, // Ocultado para FREE
        combat: null,   // Ocultado para FREE (antigo glooWall)
        rotation: null  // Ocultado para FREE
      }
    };
  }
}
```

---

## 4. Testes com Vitest e Supertest

Escrever suítes de teste de integração e e2e abrangentes no arquivo `profile.e2e-spec.ts` para testar os endpoints de perfil público:

- **Cenário 1**: Acesso anônimo ou token inválido deve retornar `401 Unauthorized`.
- **Cenário 2**: Usuário `FREE` acessando o próprio perfil deve ver todas as informações com sucesso.
- **Cenário 3**: Usuário `FREE` acessando o perfil de outro jogador deve obter dados parciais (scores nulos e flag `isRestricted: true`).
- **Cenário 4**: Usuário `PRO` ou `SCOUT` acessando o perfil de outro jogador deve ver a totalidade dos dados (`isRestricted: false` ou ausente, scores preenchidos).
- **Cenário 5**: Garantir desacoplamento absoluto dos módulos `AuthModule` e `ProfileModule` testando injeção em mocks com `vitest`.

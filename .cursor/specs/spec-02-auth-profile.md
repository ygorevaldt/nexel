# Spec 02: Auth & Perfil (JWT NestJS Guards, PUBG Profile & Caching)

Esta especificação orienta a migração do sistema de autenticação (NextAuth.js v5) e controle de perfil para a arquitetura nativa baseada em Guards, Estratégias JWT (Passport), perfis de jogadores integrados com a API do PUBG e uma política estrita de cache de dados para respeitar limites de requisição (rate limits).

---

## 1. Escopo de Trabalho
1. Criar o `AuthModule` em `libs/domain/auth` usando `@nestjs/jwt` e `@nestjs/passport`.
2. Implementar a estratégia `JwtStrategy` e o guard `JwtAuthGuard` para proteção de rotas.
3. Criar o `ProfileModule` em `libs/domain/profile` contendo `ProfileService` e `ProfileController`.
4. Migrar e portar o controle de permissão server-side do perfil público (`/api/profile/[id]`) baseado no nível de assinatura do viewer (`FREE`, `PRO`, `SCOUT`).
5. Adicionar campos de mapeamento do PUBG (`pubgAccountId`, `pubgPlayerTag`, `platform`, `lastSyncedAt`) no schema de Perfil.
6. Implementar a política de **Throttled Synchronization (Cache de 15/30 minutos)** para consultas à API oficial do PUBG.

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

## 3. Estrutura do Perfil & Cache da API do PUBG

Para evitar estourar as cotas de requisições por minuto (rate limits) impostas pela API do PUBG, implementaremos um cache agressivo em banco de dados MongoDB Atlas para estatísticas competitivas básicas.

### Campos de Sincronização no Perfil:
* `pubgAccountId`: ID interno criptográfico retornado pelo PUBG (indexado).
* `pubgPlayerTag`: Nome em exibição no jogo (ex: `Shroud`).
* `platform`: Plataforma (`steam`, `xbox`, `psn`, `kakao`).
* `lastSyncedAt`: Data/Hora da última requisição com sucesso feita à API oficial do PUBG.
* `stats`: Objeto aninhado com `kdRatio`, `winRate`, `headshotRate`, `matchesPlayed` e `currentRank`.

### Regra do Cache (Throttled Sync):
Ao requisitar os dados competitivos do jogador por meio do endpoint `/profile/:id`:
1. O backend busca o perfil no banco MongoDB.
2. O sistema verifica a diferença entre o horário atual e `profile.lastSyncedAt`.
3. **Cache Hit (Diferença < 15 minutos)**: O NestJS ignora a API do PUBG e retorna os dados cacheados no MongoDB instantaneamente.
4. **Cache Miss (Diferença >= 15 minutos ou primeira consulta)**: O NestJS realiza a requisição HTTP para a API do PUBG, atualiza as estatísticas, altera `lastSyncedAt = new Date()` no banco e retorna os dados atualizados ao usuário.

---

## 4. Controle de Permissões Server-Side (Profile Visibility)

Conforme a lógica do Nexel, a API do NestJS decidirá server-side o que retornar ao cliente baseado na assinatura (`subscriptionStatus`) do visualizador:

### Lógica de Filtragem Server-Side no `ProfileService`:
```typescript
@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private readonly profileModel: Model<Profile>,
    private readonly pubgApiService: PubgApiService
  ) {}

  async findProfileForViewer(profileId: string, viewerUser: User): Promise<any> {
    let targetProfile = await this.profileModel.findById(profileId).lean();
    if (!targetProfile) throw new NotFoundException('Perfil não encontrado');

    // Lógica do Cache Throttling antes de retornar
    const timeSinceLastSync = Date.now() - new Date(targetProfile.lastSyncedAt).getTime();
    const fifteenMinutesInMs = 15 * 60 * 1000;

    if (timeSinceLastSync >= fifteenMinutesInMs && targetProfile.pubgAccountId) {
      try {
        // Dispara sincronização com a API oficial do PUBG
        const freshStats = await this.pubgApiService.fetchPlayerStats(
          targetProfile.pubgAccountId,
          targetProfile.platform
        );
        targetProfile = await this.profileModel.findByIdAndUpdate(
          profileId,
          {
            stats: freshStats,
            lastSyncedAt: new Date()
          },
          { new: true }
        ).lean();
      } catch (error) {
        // Em caso de erro na API do PUBG, faz o fallback para os dados de cache com log silencioso
        console.error(`Falha ao sincronizar com a API do PUBG: ${error.message}`);
      }
    }

    const isOwnProfile = String(targetProfile.userId) === String(viewerUser._id);
    const isScout = viewerUser.subscriptionStatus === 'SCOUT';
    const isPro = viewerUser.subscriptionStatus === 'PRO';
    const isAdmin = viewerUser.systemRole === 'ADM';

    // Acesso Completo
    if (isOwnProfile || isScout || isPro || isAdmin) {
      return targetProfile; 
    }

    // Acesso Restrito (Plano FREE visualizando terceiros)
    // Mascara scores sensíveis de IA e oculta dados de contato
    return {
      _id: targetProfile._id,
      name: targetProfile.name,
      pubgPlayerTag: targetProfile.pubgPlayerTag,
      avatarUrl: targetProfile.avatarUrl,
      subscriptionStatus: targetProfile.subscriptionStatus,
      gameStyle: targetProfile.gameStyle,
      stats: targetProfile.stats, // Estatísticas básicas do PUBG são públicas para SEO/Atração
      isRestricted: true, // Avisa o frontend para exibir CTA de Upgrade
      scores: {
        movement: null, // Ocultado para FREE
        combat: null,   // Ocultado para FREE
        rotation: null  // Ocultado para FREE
      }
    };
  }
}
```

---

## 5. Testes com Vitest e Supertest

Escrever suítes de teste de integração e e2e abrangentes no arquivo `profile.e2e-spec.ts` para testar os endpoints de perfil público:

- **Cenário 1**: Acesso anônimo ou token inválido deve retornar `401 Unauthorized`.
- **Cenário 2**: Usuário `FREE` acessando o próprio perfil deve ver todas as informações com sucesso.
- **Cenário 3**: Usuário `FREE` acessando o perfil de outro jogador deve obter dados parciais (scores nulos e flag `isRestricted: true`), mas contendo o histórico de partidas e K/D básico do PUBG.
- **Cenário 4 (Teste do Cache)**:
  - Fazer uma primeira chamada ao endpoint. O mock do serviço `PubgApiService` deve ser chamado 1 vez.
  - Fazer uma segunda chamada imediata. O mock do serviço `PubgApiService` **não** deve ser invocado, atestando que os dados retornaram do MongoDB.
- **Cenário 5**: Garantir desacoplamento absoluto dos módulos `AuthModule` e `ProfileModule` testando injeção em mocks com `vitest`.

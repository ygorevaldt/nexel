---
name: criar-servico-nestjs
description: Habilidade para criar Services nativos do NestJS decorados com `@Injectable()` seguindo as diretrizes oficiais de persistência, injeção de dependência e testes unitários.
trigger: "Quando for necessário criar lógica de negócio, interações de persistência com o MongoDB (Mongoose) ou provedores de dados no backend."
---

# Skill: Criar Serviço NestJS

## Contexto de Uso
Utilize esta habilidade sempre que for necessária a implementação de lógica operacional, regras de negócio ou conexões de dados no NestJS. O Service deve ser injetável e registrado no módulo correspondente de forma nativa.

---

## Processo Sequencial de Execução

### Passo 1 — Executar a Geração via CLI
Gere a classe básica do Service de forma automática utilizando a CLI do Nx, especificando o projeto do módulo de destino para garantir a consistência do build:

```bash
npx nx g @nx/nest:service <nome-do-servico> --project=domain-<nome-do-modulo> --directory=libs/domain/<nome-do-modulo>/src/lib/services --flat
```

> ⚠️ **Atenção:** Substitua `<nome-do-servico>` pelo nome funcional do service em kebab-case e `<nome-do-modulo>` pelo subdomínio de destino. O parâmetro `--flat` impede a criação de subdiretórios adicionais.

---

### Passo 2 — Estruturar a Injeção de Dependências e Mongoose
Implemente o construtor do Service seguindo as técnicas oficiais recomendadas:
- Injetar o modelo Mongoose usando `@InjectModel(ClassName.name)`.
- Injetar chaves de configuração usando `ConfigService`.
- Evitar o uso de `process.env` direto.

```typescript
// Exemplo Gold Standard: libs/domain/profile/src/lib/services/player-profile.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Profile } from '@nexel/shared-types';

@Injectable()
export class PlayerProfileService {
  private readonly defaultPlatform: string;

  constructor(
    @InjectModel(Profile.name) private readonly profileModel: Model<Profile>,
    private readonly configService: ConfigService
  ) {
    this.defaultPlatform = this.configService.get<string>('DEFAULT_PUBG_PLATFORM', 'steam');
  }

  async getProfileByTag(playerTag: string): Promise<Profile> {
    const profile = await this.profileModel.findOne({ pubgPlayerTag: playerTag }).exec();
    if (!profile) {
      throw new NotFoundException(`Perfil do jogador "${playerTag}" não encontrado.`);
    }
    return profile;
  }
}
```

---

### Passo 3 — Criar Suite de Testes Unitários (Vitest)
Crie o arquivo de testes unitários `.spec.ts` correspondente na mesma pasta do service. Mocke o modelo Mongoose e dependências para testar a lógica do serviço em isolamento:

```typescript
// Exemplo Gold Standard: libs/domain/profile/src/lib/services/player-profile.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { PlayerProfileService } from './player-profile.service';
import { Profile } from '@nexel/shared-types';

describe('PlayerProfileService', () => {
  let service: PlayerProfileService;
  let mockProfileModel: any;

  beforeEach(async () => {
    // Mock do modelo Mongoose do Profile
    mockProfileModel = {
      findOne: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerProfileService,
        {
          provide: getModelToken(Profile.name),
          useValue: mockProfileModel,
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('steam'),
          },
        },
      ],
    }).compile();

    service = module.get<PlayerProfileService>(PlayerProfileService);
  });

  it('deve buscar perfil por tag com sucesso', async () => {
    const dummyProfile = { pubgPlayerTag: 'YgoreValdt', platform: 'steam' };
    mockProfileModel.exec.mockResolvedValue(dummyProfile);

    const result = await service.getProfileByTag('YgoreValdt');
    expect(result).toEqual(dummyProfile);
  });
});
```

---

### Passo 4 — Registrar o Service no Módulo
Abra o módulo correspondente da biblioteca (ex: `domain-<nome-do-modulo>.module.ts`), certifique-se de importar o service e adicioná-lo nos arrays de `providers` e `exports` do decorator `@Module()`.

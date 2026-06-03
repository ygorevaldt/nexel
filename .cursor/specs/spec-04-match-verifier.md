# Spec 04: Verificador de Partidas & Antifraude (PUBG API Match Verifier)

Esta especificação orienta a implementação do sistema de verificação de partidas e validação de vitórias no NestJS para o PUBG. Substituiremos o antigo sistema de análise visual de capturas de tela por uma validação criptográfica e de dados táticos diretamente com a API do PUBG, eliminando a fraude e otimizando custos com inteligência artificial.

---

## 1. Escopo de Trabalho
1. Criar o `MatchVerifierModule` em `libs/domain/match-verifier` contendo `MatchVerifierController`, `MatchVerifierService` e `PubgApiConnectorService`.
2. Implementar a lógica de busca de partidas oficiais do PUBG por `matchId` e `platform`.
3. Validar se o jogador participou da partida e se obteve a colocação reivindicada (ex: vitória/top 1: `winPlace === 1`).
4. Implementar o cache de verificação de partidas em banco de dados para evitar reconsultas redundantes à API do PUBG (respeitando limites de rate limiting).

---

## 2. Fluxo de Validação e Caching

Para evitar chamadas desnecessárias e repetidas à API externa do PUBG (que possui limite estrito de requisições por minuto), o sistema deve cachear os resultados verificados no banco MongoDB.

```
[Requisição de Verificação] ──> [Checar Banco de Dados (MatchVerification)] 
                                      │
                                      ├──> [Encontrado?]
                                                │
                                                ├─── (SIM: Reaproveita Cache) ──> [Retorna Verificação Instantaneamente]
                                                │
                                                └─── (NÃO: Consulta API PUBG) ──> [Obtém Partida Oficial]
                                                                                           │
                                                                                           ├─── [Valida Jogador e winPlace]
                                                                                           │
                                                                                           └─── [Salva no DB e Retorna]
```

### Esquema do `MatchVerification` no MongoDB (libs/shared/types):
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'match_verifications' })
export class MatchVerification extends Document {
  @Prop({ required: true, unique: true, index: true })
  matchId: string;

  @Prop({ required: true, index: true })
  pubgAccountId: string;

  @Prop({ required: true })
  isVictory: boolean;

  @Prop({ required: true })
  winPlace: number;

  @Prop({ required: true })
  kills: number;

  @Prop({ required: true })
  damageDealt: number;

  @Prop({ required: true })
  timeSurvived: number;
}

export const MatchVerificationSchema = SchemaFactory.createForClass(MatchVerification);
```

---

## 3. Implementação do MatchVerifierService

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MatchVerification } from '@nexel/shared-types';
import { PubgApiConnectorService } from './pubg-api-connector.service';

@Injectable()
export class MatchVerifierService {
  constructor(
    @InjectModel(MatchVerification.name) private readonly matchModel: Model<MatchVerification>,
    private readonly pubgApi: PubgApiConnectorService
  ) {}

  async verifyMatch(matchId: string, platform: string, pubgAccountId: string): Promise<any> {
    // 1. Checa se a partida já foi verificada para este jogador (Cache Hit)
    const cachedMatch = await this.matchModel.findOne({ matchId, pubgAccountId }).lean();
    if (cachedMatch) {
      return {
        matchId: cachedMatch.matchId,
        isVerified: true,
        isVictory: cachedMatch.isVictory,
        winPlace: cachedMatch.winPlace,
        stats: {
          kills: cachedMatch.kills,
          damageDealt: cachedMatch.damageDealt,
          timeSurvived: cachedMatch.timeSurvived
        },
        cached: true
      };
    }

    // 2. Consulta a API oficial do PUBG
    const matchData = await this.pubgApi.fetchMatchDetails(matchId, platform);
    if (!matchData) {
      throw new NotFoundException('Partida não encontrada no PUBG.');
    }

    // 3. Localiza o participante no JSON da partida
    const participant = this.findParticipant(matchData, pubgAccountId);
    if (!participant) {
      throw new BadRequestException('O jogador não participou desta partida.');
    }

    const stats = participant.attributes.stats;
    const isVictory = stats.winPlace === 1;

    // 4. Salva a verificação no MongoDB para cache futuro
    const newVerification = await this.matchModel.create({
      matchId,
      pubgAccountId,
      isVictory,
      winPlace: stats.winPlace,
      kills: stats.kills,
      damageDealt: stats.damageDealt,
      timeSurvived: stats.timeSurvived
    });

    return {
      matchId: newVerification.matchId,
      isVerified: true,
      isVictory,
      winPlace: stats.winPlace,
      stats: {
        kills: stats.kills,
        damageDealt: stats.damageDealt,
        timeSurvived: stats.timeSurvived
      },
      cached: false
    };
  }

  private findParticipant(matchData: any, pubgAccountId: string): any {
    // Procura no array "included" o objeto do tipo "participant" cujo stats.playerId seja igual ao pubgAccountId
    return matchData.included?.find(
      (item: any) =>
        item.type === 'participant' &&
        item.attributes?.stats?.playerId === pubgAccountId
    );
  }
}
```

---

## 4. Cenários de Teste com Vitest
1. **Retorno do Cache**: Validar se chamadas consecutivas com o mesmo `matchId` retornam a flag `cached: true` e não disparam requisições adicionais ao `PubgApiConnectorService`.
2. **Validação de Participação**: Simular uma resposta de API do PUBG onde o `pubgAccountId` do jogador não está listado na partida. O teste deve validar se a API responde com erro `400 Bad Request`.
3. **Verificação de Vitória**: Validar se uma partida com colocação final `winPlace: 1` retorna `isVictory: true` e uma colocação `winPlace: 15` retorna `isVictory: false`.

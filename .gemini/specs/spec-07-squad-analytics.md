# Spec 07: Squad Analytics (Premium Team Synergy & Telemetry Aggregation)

Esta especificação orienta o desenvolvimento da funcionalidade premium de análise de equipes (**Squad Analytics**). Mapearemos o comportamento tático de um time inteiro na partida a partir do agrupamento dos dados de telemetria dos 4 integrantes, avaliando sinergia, tempo de reação, cobertura e gerando relatórios de IA consolidados para o grupo.

---

## 1. Escopo de Trabalho
1. Criar o `SquadAnalyticsModule` em `libs/domain/squad-analytics` contendo `SquadAnalyticsController` e `SquadAnalyticsService`.
2. Implementar o parsing de telemetria agregada por equipe, filtrando os membros pelo identificador `rosterId` da resposta da API do PUBG.
3. Desenvolver algoritmos para calcular métricas de sinergia do time:
   - **Primeira Morte (First Blood/Down)**: Identificar quem do squad costuma morrer primeiro nas batalhas e em qual fase da partida.
   - **Mapeamento de Proximidade (Clustering)**: Calcular a distância média entre os membros do time ao longo do tempo (usando as coordenadas de `LogPlayerPosition`) para determinar se o time joga coeso ou muito disperso.
   - **Suporte & Cobertura**: Frequência de resgates (`LogPlayerRevive`) e tempo de resposta para reerguer aliados caídos.
   - **Distribuição de Dano**: Proporção de dano total causado e sofrido por integrante (revelando quem carrega o combate e quem se expõe em excesso).
4. Integrar o **AI Squad Coach**: Enviar o consolidado de telemetria do time para o Gemini 2.5 Flash, que gerará um relatório estratégico B2B/Semi-pro estruturado sobre a sinergia e falhas do grupo.

---

## 2. Estrutura de Dados do Banco (SquadAnalysis)

A análise do Squad será cacheada permanentemente no MongoDB utilizando o `matchId` da partida e a lista de IDs de jogadores pertencentes àquele squad específico.

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'squad_analyses' })
export class SquadAnalysis extends Document {
  @Prop({ required: true, index: true })
  matchId: string;

  @Prop({ type: [String], required: true, index: true })
  pubgAccountIds: string[]; // Lista de IDs de jogadores que compõem o squad

  @Prop({ type: Object, required: true })
  synergyMetrics: {
    proximityScore: number;    // 0-100 (coesão de posicionamento)
    reviveResponseTime: number; // Tempo médio em segundos para iniciar um revive
    firstDeathsCount: Record<string, number>; // Quantas vezes cada ID foi a 1ª morte
    damageDistribution: Record<string, number>; // % de contribuição de dano de cada ID
  };

  @Prop({ type: Object, required: true })
  aiFeedback: {
    teamStrengths: string[];
    teamWeaknesses: string[];
    tacticalAdvice: string; // Relatório estruturado do Gemini Coach
  };
}

export const SquadAnalysisSchema = SchemaFactory.createForClass(SquadAnalysis);
```

---

## 3. Lógica de Processamento de Sinergia (Telemetry Parsing)

O `SquadAnalyticsService` processará o arquivo JSON de telemetria identificando todos os 4 jogadores do time do usuário ativo:

1. **Agrupamento de Telemetria (`rosterId`)**:
   - Da resposta da API de partidas (`GET /matches/{id}`), localizamos a lista de jogadores contidos no mesmo objeto `roster` do solicitante.
2. **Cálculo de Proximidade (Coesão)**:
   - A cada 30 segundos de jogo, extraímos as posições $(X, Y)$ de todos os 4 jogadores vivos do squad.
   - Calculamos a distância Euclidiana entre eles:
     $$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
   - Se a distância média for muito alta (ex: maior que 200 metros), o sistema marca baixa coesão.
3. **Análise de Revive e Trade**:
   - Medimos o intervalo de tempo entre o evento de derrubada de um aliado (`LogPlayerMakeDamage` resultando em DBNO) e o início do salvamento (`LogPlayerRevive` ou `LogPlayerMakeDamage` do aliado contra o agressor original - representando um "trade").
   - Isso avalia a capacidade de cobertura tática e assistência do time sob pressão.

---

## 4. Prompt do AI Squad Coach (Gemini API)

O prompt de análise de Squad enviará as métricas calculadas em formato estruturado (com suporte a i18n via cabeçalho):

```typescript
const prompt = `
Analise a sinergia da equipe de PUBG com base nas métricas de telemetria abaixo:
Membros do Squad: Jogador A, Jogador B, Jogador C, Jogador D.
Dano total do Squad: 1200 (Jogador A: 50%, Jogador B: 25%, Jogador C: 15%, Jogador D: 10%).
Primeiras mortes em combates: Jogador D morreu primeiro em 3 dos 4 confrontos.
Distância média entre os membros: 180 metros (Dispersos).
Tempo médio para iniciar salvamento (revive): 14 segundos (Lento).

Gere um relatório estratégico de coaching no formato JSON para o time.
`;
```

---

## 5. Cenários de Teste com Vitest
- **Cálculo de Distância Euclidiana**: Validar se o algoritmo calcula corretamente a distância média e o score de proximidade a partir de coordenadas geográficas mockadas da telemetria.
- **Detecção de Primeira Morte**: Validar se o loop de eventos identifica de forma precisa qual conta de jogador foi o primeiro registro de morte/derrubada (DBNO) na equipe na linha do tempo.

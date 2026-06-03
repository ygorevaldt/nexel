# Spec 03: Engine do Coach IA (Gemini API & Telemetria do PUBG)

Esta especificação orienta a migração do motor de análises de gameplay por IA (Gemini 2.5 Flash) do Next.js para o NestJS, adaptado para realizar análises estratégicas de partidas de PUBG usando dados de telemetria da API oficial, em substituição ao processamento manual de vídeos do YouTube.

---

## 1. Escopo de Trabalho
1. Criar o `CoachIaModule` em `libs/domain/coach-ia` contendo `CoachIaController`, `CoachIaService` e `GeminiProvider`.
2. Encapsular a chamada do Google Gemini no `GeminiProvider` com o prompt do Coach de Elite especializado em PUBG, forçando **Structured Outputs** determinísticos do `gemini-2.5-flash`.
3. Implementar um sistema de **Fila Assíncrona** gerenciado localmente via Eventos no NestJS (`@nestjs/event-emitter` ou Fila Reativa RxJS) com suporte plugável para BullMQ/Redis.
4. Implementar endpoints de postagem de análise e consulta de status (`/coach-ia/analyze` e `/coach-ia/analyze/:id/status`).
5. Migrar regras de rate-limiting (limite de 5 envios diários para usuários PRO e consumo de créditos de boas-vindas para FREE).
6. Integrar a busca de dados de telemetria (via `pubg-api-specialist`) para baixar a partida do PUBG e consolidar os dados antes do envio para a IA.

---

## 2. GeminiProvider (Structured Output)

A integração com o `@google/genai` deve ser centralizada no `GeminiProvider`. O schema JSON determinístico mapeará scores de Movimentação, Combate e Rotação:

```typescript
import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiProvider {
  private ai: GoogleGenAI;
  private readonly analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      overall_potential_score: { type: Type.INTEGER, description: "Nota geral de 0 a 100 baseada na performance global." },
      movement_score: { type: Type.INTEGER, description: "Nota 0-100 para movimentação e evasão de inimigos." },
      combat_score: { type: Type.INTEGER, description: "Nota 0-100 para precisão, uso de utilitários e eficiência em confrontos." },
      rotation_efficiency: { type: Type.INTEGER, description: "Nota 0-100 para posicionamento nas zonas seguras (círculos)." },
      recruiter_feedback: { type: Type.STRING, description: "Feedback detalhado do Coach de Elite em estilo coaching profissional tático." },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Pontos fortes demonstrados na partida." },
      areas_for_improvement: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Oportunidades de melhoria tática." },
      recommended_playstyle: { type: Type.STRING, description: "Estilo de jogo tático recomendado (ex: Rusher, Sniper, Rotacionador Lento, Borda de Gás)." }
    },
    required: [
      "overall_potential_score",
      "movement_score",
      "combat_score",
      "rotation_efficiency",
      "recruiter_feedback",
      "strengths",
      "areas_for_improvement",
      "recommended_playstyle"
    ]
  };

  constructor(private readonly configService: ConfigService) {
    this.ai = new GoogleGenAI({ apiKey: this.configService.get<string>('GEMINI_API_KEY') });
  }

  async generateGameplayAnalysis(telemetrySummary: string): Promise<any> {
    const prompt = `Analise a telemetria da partida do jogador no PUBG e forneça feedback tático estruturado:\n\n${telemetrySummary}`;
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt],
      config: {
        responseMimeType: 'application/json',
        responseSchema: this.analysisSchema,
        temperature: 0.2,
      }
    });

    if (!response.text) throw new Error('Retorno vazio do Gemini.');
    return JSON.parse(response.text);
  }
}
```

---

## 3. Fila Assíncrona no NestJS (Background Processing)

Em substituição ao `waitUntil` do Vercel Serverless, criaremos uma arquitetura orientada a eventos usando o `@nestjs/event-emitter` do NestJS. O controller responde imediatamente `202 Accepted` ao receber o ID da partida (`matchId`) e plataforma, emitindo um evento local que é processado em segundo plano por um Listener gerenciado.

### Lógica do Fluxo de Enfileiramento:
1. O usuário chama `POST /coach-ia/analyze` enviando o payload `{ matchId, platform }`.
2. O `CoachIaService` valida limites diários e créditos e cria o registro no MongoDB com status `"PROCESSING"`.
3. O serviço emite o evento `analysis.queued` e retorna instantaneamente o `analysisId` com status `PROCESSING` (Retorno 202).
4. O `AnalysisEventListener` escuta o evento `analysis.queued` de forma assíncrona:
   - Invoca o serviço da API do PUBG para obter os dados da partida.
   - Baixa o JSON de telemetria.
   - Resume a telemetria para o jogador em formato de texto.
   - Invoca o `GeminiProvider`.
   - Atualiza os scores no perfil do jogador.
   - Altera o status no MongoDB para `"COMPLETED"` ou `"FAILED"` se houver erro.

```typescript
// Evento emitido
export class AnalysisQueuedEvent {
  constructor(
    public readonly analysisId: string,
    public readonly matchId: string,
    public readonly platform: string,
    public readonly pubgAccountId: string,
    public readonly profileId: string
  ) {}
}

// Processador em segundo plano
@Injectable()
export class AnalysisEventListener {
  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly pubgApiService: PubgApiService, // Serviço que interage com a API PUBG
    private readonly coachIaService: CoachIaService
  ) {}

  @OnEvent('analysis.queued', { async: true }) // Roda em background
  async handleAnalysisQueued(event: AnalysisQueuedEvent) {
    try {
      // 1. Puxa a telemetria e gera o resumo textual
      const telemetrySummary = await this.pubgApiService.getMatchTelemetrySummary(event.matchId, event.platform, event.pubgAccountId);
      
      // 2. Envia para o Gemini
      const result = await this.geminiProvider.generateGameplayAnalysis(telemetrySummary);
      
      // 3. Finaliza a análise gravando no banco e atualizando o score do perfil
      await this.coachIaService.completeAnalysis(event.analysisId, result);
    } catch (error) {
      await this.coachIaService.failAnalysis(event.analysisId, error.message);
    }
  }
}
```

---

## 4. Polling de Status
- Rota: `GET /coach-ia/analyze/:id/status`
- Retorna o status atual (`PROCESSING`, `COMPLETED`, `FAILED`) e o resultado da análise se já estiver concluído.
- Previne sobrecarga no banco de dados com leituras eficientes (`.lean()` do Mongoose).

---

## 5. Testes com Vitest
- **Mock do Gemini e API PUBG**: Garantir que as chamadas de API do PUBG e do Google Gemini sejam totalmente mockadas nos testes unitários e de integração utilizando `vi.fn()`.
- **Validação de Limites**: Testar que usuários PRO estourando o limite diário de 5 análises recebem status `429 Too Many Requests`.
- **Fluxo Background**: Validar que a emissão do evento é disparada e o status muda para `COMPLETED` no MongoDB após a simulação de resolução do processamento de telemetria e IA.

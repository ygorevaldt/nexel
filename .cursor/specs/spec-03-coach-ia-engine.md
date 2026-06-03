# Spec 03: Engine do Coach IA (Gemini API, Telemetria & Insights de Armas)

Esta especificação orienta a implementação do motor de análises de gameplay por IA (Gemini 2.5 Flash) no NestJS, adaptada para ler arquivos de telemetria do PUBG, extrair insights técnicos detalhados sobre o desempenho de armas e recuo (spray), e fornecer suporte nativo a multi-idiomas (internacionalização) desde o prompt de IA.

---

## 1. Escopo de Trabalho
1. Criar o `CoachIaModule` em `libs/domain/coach-ia` contendo `CoachIaController`, `CoachIaService` e `GeminiProvider`.
2. Encapsular a chamada do Google Gemini no `GeminiProvider` com o prompt do Coach de Elite especializado em PUBG, forçando **Structured Outputs** determinísticos do `gemini-2.5-flash`.
3. Adicionar o suporte a **Internacionalização (i18n)**: passar o idioma desejado (`pt` ou `en`) ao prompt, forçando o Gemini a responder o feedback no idioma do usuário.
4. Desenvolver o algoritmo de parsing no backend para analisar eventos de disparos (`LogPlayerAttack`) e danos (`LogPlayerTakeDamage`), calculando a eficiência de armas individuais e comportamento do recuo (spray).
5. Configurar o sistema de **Fila Assíncrona** gerenciado localmente via Eventos no NestJS com suporte a status `PROCESSING`, `COMPLETED` e `FAILED` no MongoDB.

---

## 2. GeminiProvider (Structured Output com Suporte a i18n)

A integração com o `@google/genai` deve ser centralizada no `GeminiProvider`. O schema JSON determinístico mapeará os scores e o feedback de coaching internacionalizado.

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
      weapon_analysis: {
        type: Type.OBJECT,
        properties: {
          spray_control_feedback: { type: Type.STRING, description: "Feedback específico sobre o controle de recuo/spray de armas automáticas." },
          setup_recommendation: { type: Type.STRING, description: "Sugestões de acoplamentos/attachments e armas recomendados com base no desempenho." }
        },
        required: ["spray_control_feedback", "setup_recommendation"]
      },
      recommended_playstyle: { type: Type.STRING, description: "Estilo de jogo tático recomendado (ex: Rusher, Sniper, Rotacionador Lento)." }
    },
    required: [
      "overall_potential_score",
      "movement_score",
      "combat_score",
      "rotation_efficiency",
      "recruiter_feedback",
      "strengths",
      "areas_for_improvement",
      "weapon_analysis",
      "recommended_playstyle"
    ]
  };

  constructor(private readonly configService: ConfigService) {
    this.ai = new GoogleGenAI({ apiKey: this.configService.get<string>('GEMINI_API_KEY') });
  }

  async generateGameplayAnalysis(telemetrySummary: string, language: 'en' | 'pt'): Promise<any> {
    const promptInstructions = language === 'en' 
      ? "You are an elite PUBG esports coach. Analyze the telemetry data below and generate the JSON response strictly in English language." 
      : "Você é um técnico de elite de PUBG esports. Analise a telemetria abaixo e gere as respostas em formato JSON estritamente no idioma Português.";

    const prompt = `${promptInstructions}\n\nResumo de Telemetria:\n${telemetrySummary}`;

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

## 3. Algoritmo de Parsing de Armas & Recuo (Spray Analysis)

Antes de invocar o Gemini, o `PubgApiService` analisa o fluxo bruto de eventos da telemetria da partida específica do jogador:

1. **Associação de Tiros e Danos (`LogPlayerAttack` ➡️ `LogPlayerTakeDamage`)**:
   - Mapeamos a cadência de disparos agrupando eventos `LogPlayerAttack` consecutivos em intervalos inferiores a 500ms (representando rajadas ou spray contínuo).
   - Analisamos a quantidade de tiros disparados contra a quantidade de tiros que acertaram o inimigo (`LogPlayerTakeDamage` correspondente).
   - Se a taxa de acerto despencar após os primeiros 5 tiros em combate de média/longa distância com armas como `Beryl M762` ou `M416`, deduz-se deficiência no controle do recuo inicial do spray.
2. **Setup de Acessórios (`LogItemEquip`)**:
   - Correlacionamos os acoplamentos equipados (Compensador, Punho Vertical, Punho Angular, etc.) com a taxa de acerto geral da arma correspondente.
   - Isso permite à IA sugerir mudanças precisas de setup (ex: *"Sua taxa de headshot com a Mini14 aumentou 15% após equipar o compensador e punho leve"*).
3. **Consolidação do Prompt**:
   - O backend gera uma seção específica no resumo da telemetria:
     ```text
     [Weapon Stats]
     - M416: 120 disparos efetuados. 4 rajadas de spray contínuo. Taxa de acerto nos primeiros 5 disparos: 60%. Taxa de acerto após 5 disparos: 15% (alvo a 45 metros). Acessórios equipados: Silenciador, Punho Angular.
     - Mini14: 30 disparos. Taxa de headshot: 22%. Acessórios equipados: Compensador, Punho Leve.
     ```

---

## 4. Rota do Controller (i18n Header)

O endpoint `/coach-ia/analyze` aceitará o cabeçalho de idioma e enviará o contexto ao fluxo de eventos:

```typescript
@Controller('coach-ia')
export class CoachIaController {
  constructor(private readonly coachIaService: CoachIaService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  async queueAnalysis(
    @Body() body: { matchId: string; platform: string },
    @Headers('accept-language') acceptLanguage: string,
    @Req() req: any
  ) {
    const language = acceptLanguage?.startsWith('en') ? 'en' : 'pt';
    const analysisId = await this.coachIaService.enqueue(
      body.matchId,
      body.platform,
      req.user.pubgAccountId,
      req.user.profileId,
      language
    );
    return { analysisId, status: 'PROCESSING' };
  }
}
```

---

## 5. Testes com Vitest
- **Teste de Idioma (i18n)**: Validar nos mocks se a string de prompt enviada à chamada do Gemini inclui a instrução de idioma correspondente (`en` ou `pt`) conforme o cabeçalho de request enviado.
- **Teste de Cálculo de Spray**: Inserir uma telemetria mockada onde um jogador erra a maior parte dos tiros após o 5º disparo. Garantir que o resumo de telemetria compilado pelo backend contenha as estatísticas de declínio de acerto do spray descritas de forma correta.

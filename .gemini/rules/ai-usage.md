# AI Usage — Google Gemini API (NestJS Integration)

Este documento define os padrões obrigatórios e restrições técnicas para a integração com a API do Google Gemini (`@google/genai`) utilizando o ecossistema NestJS no monorepo Nexel.

---

## 1. Modelo Padrão: `gemini-2.5-flash`

- Sempre utilizar o modelo `gemini-2.5-flash` como padrão do ecossistema.
- O modelo Flash oferece excelente custo-benefício, altíssima velocidade de geração e capacidade de processamento de texto perfeitamente adequada para leitura e análise estratégica de resumos de telemetria (JSON/Texto).
- Modelos maiores ou da linha Pro só podem ser utilizados sob justificativa técnica aprovada explicitamente e documentada por comentários arquiteturais.

---

## 2. Structured Output Determinístico

- Qualquer chamada de geração de conteúdo ao Gemini que alimentará lógica de banco de dados ou regras de negócio **DEVE** forçar o uso de Structured Outputs.
- Configurar sempre `responseMimeType: "application/json"` e fornecer o respectivo `responseSchema` (usando os Schemas de tipo do `@google/genai`).
- Parsear o JSON de resposta de forma segura no NestJS e validá-lo contra DTOs ou Zod antes de prosseguir com alterações de estado no banco de dados.

```typescript
import { GoogleGenAI, Type, Schema } from '@google/genai';

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_potential_score: { type: Type.INTEGER },
    movement_score: { type: Type.INTEGER },
    rotation_efficiency: { type: Type.INTEGER },
    recruiter_feedback: { type: Type.STRING }
  },
  required: ['overall_potential_score', 'movement_score', 'rotation_efficiency', 'recruiter_feedback']
};

const response = await this.ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [prompt],
  config: {
    responseMimeType: 'application/json',
    responseSchema: schema,
    temperature: 0.2, // Temperatura baixa garante mais rigidez e foco técnico
  }
});

const result = JSON.parse(response.text!);
```

---

## 3. Análise de Telemetria de Partida (Texto Estruturado)

- O input do Gemini para o Coach IA é um resumo textual e cronológico da telemetria da partida (gerado pelo backend a partir do JSON bruto baixado da API do PUBG).
- **PROIBIDO** enviar o JSON de telemetria bruto sem tratamento para o Gemini (isso consumiria tokens desnecessários e excederia limites de contexto). O backend deve pré-processar e agregar as métricas (ex: tempo de sobrevivência, rota percorrida, encontros de combate, zona azul e armas utilizadas).

```typescript
const prompt = `
Analise a performance do jogador no PUBG com base no resumo de telemetria abaixo:
Armas utilizadas: M416 (3 eliminações), Kar98k (1 eliminação).
Tempo de sobrevivência: 24 minutos (Fase 7 da Zona Azul).
Posição final: 4º lugar de 100.
Histórico de Rotação: Pousou em Pochinki. Moveu-se para School aos 06:12. Ficou preso no gás por 45 segundos na Fase 4.
Combate: Causou 520 de dano, precisão de headshot de 18%, tomou dano 3 vezes.
`;
```

---

## 4. Otimização de Caches de Análise

Para reduzir custos de consumo de tokens Gemini e latência em requisições redundantes, devemos obrigatoriamente aplicar cache no banco de dados:

### Caching por Match ID
- Aplicado em análises de partidas do PUBG.
- O campo `matchId` (UUID retornado pela API do PUBG) serve como chave única da partida.
- Antes de invocar o Gemini, realiza uma busca prévia no MongoDB pela collection `AiAnalysis` filtrando por `matchId` e `accountId` (jogador).
- Se houver registro com status concluído, retorna a análise em cache instantaneamente, poupando tokens e processamento.

---

## 5. Limites e Tratamento de Erros

- O backend deve impor limites rigorosos de requisições diárias por nível de assinatura (ex: 5 análises diárias para usuários PRO, limite de créditos para FREE).
- Se a telemetria da partida recebida for inválida ou não contiver eventos suficientes para o jogador indicado (ex: desconexão precoce), o backend deve recusar a análise e retornar uma exceção adequada (`BadRequestException` ou `UnprocessableEntityException`).

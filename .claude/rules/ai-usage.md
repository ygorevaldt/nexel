# AI Usage — Nexel (Gemini)

## Modelo padrão: `gemini-2.0-flash`

Sempre usar `gemini-2.0-flash` salvo justificativa explícita documentada no código.
Nunca usar modelos Pro sem aprovação — o custo é 5-10x maior.

---

## Structured Output é obrigatório

Toda chamada ao Gemini deve usar Structured Output com schema explícito.
Nunca parsear texto livre — isso causa alucinações e erros de runtime.

```typescript
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({});

// ✅ CORRETO — schema tipado + structured output
const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    is_victory: { type: Type.BOOLEAN },
    kills: { type: Type.INTEGER },
    confidence: { type: Type.NUMBER },
  },
  required: ['is_victory', 'kills', 'confidence'],
};

const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: [prompt, ...imageParts],
  config: {
    responseMimeType: 'application/json',
    responseSchema: schema,
    temperature: 0.2, // baixa temperatura para análise técnica
  },
});

const data = JSON.parse(response.text!);

// ❌ ERRADO — texto livre sem schema
const response = await model.generateContent(prompt);
const data = JSON.parse(response.text); // pode quebrar em produção
```

---

## Imagens e Vídeos

- **Vídeos:** FFmpeg.wasm extrai frames no browser. A API recebe apenas frames (base64).
- **Prints/Screenshots:** recebidos como base64 direto do frontend.
- **Nunca armazenar** imagens ou vídeos no servidor — processar em memória e descartar.

```typescript
// Formato correto para passar imagem inline ao Gemini
const imagePart = {
  inlineData: {
    data: base64String.replace(/^data:image\/[a-z]+;base64,/, ''),
    mimeType: 'image/jpeg' as const,
  },
};

const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: [systemPrompt, imagePart],
  config: { ... },
});
```

---

## Threshold de Confiança

Toda análise que retorna um campo `confidence` deve rejeitar resultados abaixo de `0.75`.

```typescript
const CONFIDENCE_THRESHOLD = 0.75;

if (result.confidence < CONFIDENCE_THRESHOLD) {
  return NextResponse.json({
    success: false,
    reason: 'low_confidence',
    message: 'Não foi possível analisar com confiança suficiente. Envie uma imagem mais nítida.',
  }, { status: 422 });
}
```

---

## Limites Diários

Limites atuais (definidos como constantes, nunca valores mágicos):

```typescript
// src/app/api/analyze/route.ts
const DAILY_PRO_LIMIT = 5; // análises de gameplay por dia (PRO)
// SCOUT: ilimitado

// src/app/api/me/booyah/route.ts (quando implementado)
const BOOYAH_LIMITS = { FREE: 3, PRO: 10, SCOUT: 10 } as const;
```

---

## Context Caching

O projeto usa Context Caching do Gemini para reduzir custo em análises repetidas do mesmo jogador.
A lógica está em `AiAnalysisRepository.findCachedContextForToday()`.
Ao criar novas features de análise, verificar se caching é aplicável.

---

## Prompts

Prompts de sistema longos ficam como constantes nomeadas no topo do arquivo da rota, fora da função handler.
Nunca inline dentro da chamada `generateContent`.

```typescript
// ✅ CORRETO — prompt como constante nomeada
const BOOYAH_ANALYSIS_PROMPT = `
Você é um sistema especialista em análise forense de screenshots do Free Fire.
[...]
`.trim();

export async function POST(req: NextRequest) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [BOOYAH_ANALYSIS_PROMPT, imagePart],
    config: { ... },
  });
}
```

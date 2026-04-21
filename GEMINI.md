# Nexel — Gemini Code Context

Nexel é uma plataforma SaaS de e-sports para jogadores de Free Fire.
Jogadores enviam gameplays, recebem análise de IA, competem em desafios e constroem um perfil para serem descobertos por scouts e organizações.

**Repositório público:** https://github.com/ygorevaldt/nexel
**Deploy:** https://www.nexel.app.br

---

## Stack

- **Framework:** Next.js 16.2 com App Router e React Server Components
- **UI:** React 19, Tailwind CSS v4, Shadcn/UI, Framer Motion, Recharts
- **Banco de dados:** MongoDB Atlas via Mongoose 9
- **Autenticação:** NextAuth.js v5 (Auth.js) com JWT strategy
- **IA:** Google Gemini via `@google/genai` — sempre `gemini-2.5-flash` salvo exceção explícita
- **Pagamentos:** Stripe (integração pendente de ativação)
- **Processamento de vídeo:** API nativa do browser (`HTMLVideoElement` + `Canvas`) — client-side, nunca server-side
- **Validação:** Zod v4
- **Linguagem:** TypeScript strict mode — `"strict": true` no tsconfig

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── api/                  → API Routes (Next.js App Router)
│   │   ├── analyze/          → POST: análise de gameplay com Gemini
│   │   ├── auth/             → NextAuth handlers + registro
│   │   ├── challenges/       → CRUD de desafios da arena
│   │   ├── feed/             → GET: vitrine de talentos
│   │   ├── me/analyses/      → GET/POST: análises do usuário logado
│   │   ├── profile/[id]/     → GET: perfil público com controle de permissão
│   │   ├── ranking/          → GET: leaderboard global
│   │   ├── subscription/     → GET: planos e histórico de pagamentos
│   │   └── webhook/stripe/   → POST: webhook Stripe
│   ├── dashboard/            → Coach IA (PRO/SCOUT)
│   ├── feed/                 → Vitrine de talentos
│   ├── profile/[id]/         → Página de perfil público
│   │   └── _components/      → Componentes exclusivos desta página
│   ├── ranking/              → Leaderboard global
│   ├── subscription/         → Planos e assinatura
│   └── (login|register)/     → Auth pages
├── components/
│   ├── layout/               → Navbar, Footer, Providers
│   └── ui/                   → Componentes Shadcn/UI (não editar diretamente)
├── lib/
│   ├── auth.ts               → NextAuth config completa (Node.js)
│   ├── auth.config.ts        → NextAuth config edge-safe (sem mongoose/bcrypt)
│   ├── db.ts                 → Singleton de conexão MongoDB
│   ├── utils.ts              → cn() e utilitários gerais
│   └── video-processor.ts    → Extração de frames via API nativa do browser
├── models/                   → Schemas Mongoose
│   ├── User.ts
│   ├── Profile.ts
│   ├── AiAnalysis.ts
│   ├── Challenge.ts
│   └── Transaction.ts
├── repositories/             → ÚNICA camada de acesso ao banco
│   ├── UserRepository.ts
│   ├── ProfileRepository.ts
│   ├── AiAnalysisRepository.ts
│   ├── ChallengeRepository.ts
│   └── TransactionRepository.ts
└── types/
    └── next-auth.d.ts        → Extensão dos tipos da sessão
```

---

## Comandos Essenciais

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run lint       # ESLint
npx tsc --noEmit   # Typecheck sem gerar arquivos
```

---

## Regras Arquiteturais — OBRIGATÓRIAS

Leia `@.gemini/rules/architecture.md` antes de criar ou modificar qualquer arquivo backend. Lembre-se, como você está operando dentro do ecossistema Google (Gemini 1.5 Pro / 2.5 Flash), aproveite a sua massiva capacidade de janela de contexto para analisar todos os arquivos interconectados indicados pelo usuário.

### Resumo das regras inegociáveis:

1. **Repositories são a única porta de entrada para o banco.**
   API routes e Server Components NUNCA importam Models diretamente.
   Se precisar de dados, use o Repository correspondente.

2. **Controle de permissão é sempre server-side.**
   A API decide o que retornar com base no `subscriptionStatus` do viewer.
   O frontend apenas renderiza o que recebe — nunca esconde dados que vieram da API.

3. **Gemini sempre com Structured Output.**
   Todo uso da API Gemini deve usar `responseMimeType: "application/json"` com schema explícito.
   Nunca parsear texto livre. Sempre usar `gemini-2.5-flash` salvo justificativa documentada.

4. **Imagens e vídeos nunca são armazenados no servidor.**
   A extração de frames roda no browser via API nativa (`HTMLVideoElement` + `Canvas`). Frames e prints trafegam em memória como base64.

5. **Autenticação via `auth()` de `@/lib/auth`.**
   Nunca acessar cookies ou headers de sessão diretamente nas rotas.

---

## Padrões de Código

Leia `@.gemini/rules/code-style.md` para as convenções completas de TypeScript e React.

### Resumo:
- TypeScript strict — sem `any` implícito
- `async/await` sempre — nunca `.then()/.catch()`
- Sem valores mágicos — use constantes nomeadas
- Sem comentários explicando o óbvio — o código deve ser autoexplicativo
- Funções com responsabilidade única (SRP)
- Componentes React com props tipadas via `interface`, nunca `type` inline no JSX

---

## Planos e Permissões

| Plan | Acesso |
|------|--------|
| `FREE` | Perfil próprio básico. Vê header de outros perfis com CTA de upgrade |
| `PRO` | Coach IA (5 análises/dia), perfil completo próprio, vê scores de outros |
| `SCOUT` | Tudo do PRO + acesso a análises e contato de todos os jogadores |

A lógica de permissão está em `src/app/api/profile/[id]/route.ts` — siga o mesmo padrão ao criar novas rotas com dados sensíveis.

---

## Referências Detalhadas

- Convenções de API: `@.gemini/rules/api-conventions.md`
- Padrões de código: `@.gemini/rules/code-style.md`
- Arquitetura modular: `@.gemini/rules/architecture.md`
- Padrões de componentes React: `@.gemini/rules/frontend-patterns.md`
- Uso da IA Gemini: `@.gemini/rules/ai-usage.md`

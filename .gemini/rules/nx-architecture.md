# Regras de Arquitetura — Nx Monorepo

Este documento define as regras de organização de arquivos e comunicação no workspace do Nx Monorepo da Nexel. Estas regras são estritas e inegociáveis.

---

## 1. Estrutura do Workspace Nx

O código deve ser estritamente dividido entre aplicações (`apps/`) e bibliotecas compartilhadas ou de domínio (`libs/`).

```
nexel-monorepo/
├── apps/
│   ├── api/                   → API Backend NestJS (Fina, apenas bootstrap e roteamento)
│   └── scout-hub/             → UI Frontend Angular (Fina, apenas consumo e views)
├── libs/
│   ├── domain/                → Lógica de negócio de domínio reaproveitável
│   │   ├── auth/              → Serviços de Autenticação e estratégias JWT
│   │   ├── coach-ia/          → Motor do Coach IA (GeminiProvider, Fila de Background)
│   │   ├── profile/           → Gestão de Perfis, scores e histórico
│   │   └── social/            → Feed, Ranking global e curtidas
│   └── shared/
│       ├── types/             → DTOs, Interfaces puras, Schemas de Validação (Zod/Mongoose)
│       └── utils/             → Utilitários puros reutilizáveis
```

---

## 2. Regra Estrita de apps/ vs. libs/

- **`apps/` NÃO contêm lógica de negócio pesada:**
  - Em `apps/api` (NestJS): Os controllers devem ser extremamente finos. Eles lidam estritamente com requisições HTTP, validação de payload através de DTOs, chamada de Services injetados provenientes de `libs/` e retorno da resposta. Nenhuma regra complexa de banco de dados ou IA pode residir diretamente no app.
  - Em `apps/scout-hub` (Angular): Os componentes declarados em apps devem servir como páginas de roteamento de alto nível. Toda a lógica de apresentação e componentes ricos reutilizáveis deve ser importada de `libs/`.

- **`libs/` é o coração do sistema:**
  - Toda lógica de negócio, persistência de dados (Mongoose schemas e services), integrações de serviços de terceiros (Stripe, Gemini API) e tratamentos complexos residem obrigatoriamente dentro de subdiretórios de `libs/`.

---

## 3. Padrão de Bibliotecas Compartilhadas (Shared Library)

- **`libs/shared/types`**:
  - Biblioteca universal contendo Interfaces puras do TypeScript, DTOs de Request/Response e Schemas do Mongoose.
  - **REGRA DE OURO**: Esta biblioteca é puramente TypeScript e não deve importar bibliotecas específicas de runtime de frameworks (como decorators do Angular ou decorators do NestJS fora dos de validação agnósticos). Ela deve ser de fácil consumo por ambas as partes (NestJS e Angular).
  - É a única biblioteca com permissão de importação direta tanto por partes do Frontend quanto por partes do Backend.

---

## 4. Dependências e Acoplamento Zero (Decoupling)

- **Importações Absolutas e Path Mapping**:
  - NUNCA usar importações relativas longas (ex: `../../../../shared/types`).
  - Sempre usar os aliases de caminhos declarados no `tsconfig.base.json` gerenciados pelo Nx (ex: `@nexel/shared-types`, `@nexel/domain-auth`).

- **Limites de Comunicação**:
  - Módulos de domínio em `libs/domain/` não podem ter dependência cíclica.
  - A comunicação inter-módulos no backend NestJS deve ser feita exclusivamente via injeção de dependência através de interfaces de serviços exportados nos respectivos módulos.
  - Se `libs/domain/coach-ia` precisa de informações de perfil, ele deve importar o `ProfileModule` que expõe um `ProfileService` e usar sua interface pública. Nunca deve fazer consultas diretas ao banco de dados do módulo de perfil.

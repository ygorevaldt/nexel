# Padrões de Código — TypeScript Estrito & Clean Code

Este documento define os padrões obrigatórios de codificação em TypeScript e estilo de Clean Code a serem aplicados em todo o workspace do Nexel.

---

## 1. TypeScript Estrito (Strict Mode)

O `"strict": true` no `tsconfig.json` é absoluto e inegociável.

- **NUNCA usar casting com `as any`**: Forneça tipagens completas, declare tipos genéricos específicos ou use `unknown` aplicando narrowing.
- **NUNCA usar diretivas de escape**: O uso de `// @ts-ignore` ou `// @ts-nocheck` é proibido. Corrija a tipagem.
- **NUNCA usar asserções nulas sem justificativa**: O operador `!` (non-null assertion) só deve ser utilizado quando for logicamente impossível o valor ser nulo e acompanhado de comentário explicando o porquê.

```typescript
// ❌ ERRADO
const player = data as any;
const id = session.user!.id;

// ✅ CORRETO
const player = data as IPlayerProfile;
if (!session?.user?.id) throw new UnauthorizedException();
const id = session.user.id;
```

---

## 2. Programação Assíncrona

- **Async/Await obrigatório**: NUNCA encadear promessas usando `.then()` e `.catch()`. O código síncrono simulado com `async/await` é infinitamente mais limpo e legível.

```typescript
// ❌ ERRADO
findUserById(id).then(user => { ... }).catch(err => { ... });

// ✅ CORRETO
try {
  const user = await findUserById(id);
} catch (error) {
  // Tratamento limpo de erro
}
```

---

## 3. Sem Valores Mágicos (Named Constants)

- Qualquer número, string de configuração, limites diários ou chaves de negócio cruciais devem ser expressos por constantes nomeadas em `UPPER_SNAKE_CASE` no topo do escopo ou em arquivos de constantes reutilizáveis.

```typescript
// ❌ ERRADO
if (dailyCount >= 5) { ... }
if (score >= 70) return 'emerald';

// ✅ CORRETO
const DAILY_ANALYSIS_PRO_LIMIT = 5;
const HIGH_POTENTIAL_SCORE_THRESHOLD = 70;

if (dailyCount >= DAILY_ANALYSIS_PRO_LIMIT) { ... }
if (score >= HIGH_POTENTIAL_SCORE_THRESHOLD) return 'emerald';
```

---

## 4. Nomenclatura

- **Variáveis, propriedades e funções**: `camelCase` (ex: `generateGameplayAnalysis`, `favoritesCount`).
- **Classes, Schemas e Decorators**: `PascalCase` (ex: `UserSchema`, `ProfileService`, `InjectModel`).
- **Constantes de escopo e constantes globais**: `UPPER_SNAKE_CASE` (ex: `GEMINI_MAX_RETRIES`).
- **Interfaces e DTOs**: Prefixados ou sufixados descritivamente de acordo com sua função (ex: `IUserDocument`, `UpdateProfileDto`).

---

## 5. Comentários Autoexplicativos

- O código de produção deve se autoexplicar por meio de nomenclatura descritiva de classes, métodos e variáveis.
- Comentários devem explicar estritamente o **porquê** de uma decisão de design ou workaround não óbvio, **nunca o quê** o código faz linha a linha.

```typescript
// ❌ ERRADO — descreve o óbvio
// Incrementa o contador de favoritos
await this.profileModel.findByIdAndUpdate(id, { $inc: { favorites_count: 1 } });

// ✅ CORRETO — explica decisão técnica crucial
// Incrementamos atomicamente com $inc para evitar race conditions causadas por múltiplos favoritamentos simultâneos
await this.profileModel.findByIdAndUpdate(id, { $inc: { favorites_count: 1 } });
```

---

## 6. Single Responsibility Principle (SRP)

- Cada função, método ou serviço deve realizar uma única tarefa muito bem definida.
- Se uma função está validando dados, consultando banco de dados e enviando e-mail, fatore-a em submétodos ou delegue partes para serviços especializados.

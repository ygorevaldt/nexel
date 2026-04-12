# Code Style — Nexel

## TypeScript

### Strict mode é inegociável
O `tsconfig.json` usa `"strict": true`. Nunca contornar com:
- `as any` — use tipos corretos ou `unknown` com narrowing
- `// @ts-ignore` — corrija o tipo, não silencie o erro
- `!` (non-null assertion) sem comentário justificando

```typescript
// ❌ ERRADO
const user = data as any;
const id = session.user!.id;

// ✅ CORRETO
const user = data as IUser;
if (!session?.user?.id) return;
const id = session.user.id;
```

### Async/await sempre — nunca .then()

```typescript
// ❌ ERRADO
findUserById(id).then(user => { ... }).catch(err => { ... });

// ✅ CORRETO
const user = await findUserById(id);
```

### Sem valores mágicos — use constantes nomeadas

```typescript
// ❌ ERRADO
if (dailyCount >= 5) { ... }
if (score >= 70) return 'text-emerald-400';

// ✅ CORRETO
const DAILY_PRO_LIMIT = 5;
const SCORE_THRESHOLD_HIGH = 70;

if (dailyCount >= DAILY_PRO_LIMIT) { ... }
if (score >= SCORE_THRESHOLD_HIGH) return 'text-emerald-400';
```

### Nomenclatura
- **Variáveis e funções:** `camelCase`
- **Componentes React:** `PascalCase`
- **Constantes globais:** `UPPER_SNAKE_CASE`
- **Interfaces:** prefixo `I` para Models Mongoose (`IUser`, `IProfile`)
- **Props de componentes:** sufixo `Props` (`ProfileHeaderProps`)
- **Arquivos de componente:** `PascalCase.tsx`
- **Arquivos de utilitário/lib:** `camelCase.ts`

### Exports
- Funções utilitárias e Repositories: `export function` (named)
- Componentes React: `export function` (named), não default
- Pages do Next.js: `export default function` (obrigatório pelo framework)
- Models Mongoose: `export const`

---

## Comentários

**Regra:** o código deve ser autoexplicativo. Comentários explicam o *porquê*, nunca o *o quê*.

```typescript
// ❌ ERRADO — explica o óbvio
// Encontra o usuário pelo ID
const user = await findUserById(id);

// ✅ CORRETO — explica decisão não óbvia
// Self-heal: tokens emitidos antes da adição de subscriptionStatus não têm o campo.
// Fazemos um DB lookup único para reconstruir o campo sem forçar logout.
if (token.id && !token.subscriptionStatus) {
  const freshUser = await User.findById(token.id).lean();
  ...
}
```

Blocos de código comentado são proibidos. Use git para histórico.

---

## Funções

**Single Responsibility:** uma função faz uma coisa.

```typescript
// ❌ ERRADO — faz autenticação, busca no banco E formata resposta
export async function GET(req: NextRequest) {
  const session = await auth();
  const user = await User.findById(session.user.id); // query direta
  const subscriptionStatus = user?.subscriptionStatus ?? 'FREE';
  // ... 80 linhas de lógica misturada
}

// ✅ CORRETO — rota delega, não executa
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const user = await findUserById(session.user.id); // via Repository
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  return NextResponse.json({ subscriptionStatus: user.subscriptionStatus });
}
```

---

## Tratamento de Erros

Toda API route deve ter try/catch no nível da função handler.
Log com prefixo `[MÉTODO /caminho/da/rota]` para facilitar rastreamento.

```typescript
export async function POST(req: NextRequest) {
  try {
    // ... lógica
  } catch (error) {
    console.error('[POST /api/challenges]', error);
    return NextResponse.json({ error: 'Falha ao criar desafio' }, { status: 500 });
  }
}
```

Nunca expor stack traces ou mensagens de erro internas ao cliente em produção.

---

## Formato de Resposta das APIs

Todas as APIs seguem este padrão consistente:

```typescript
// Sucesso com dados
return NextResponse.json({ data: result }, { status: 200 });

// Sucesso com criação
return NextResponse.json({ data: result }, { status: 201 });

// Erro de cliente
return NextResponse.json({ error: 'Mensagem legível' }, { status: 400 });

// Não autenticado
return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

// Acesso negado
return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

// Não encontrado
return NextResponse.json({ error: 'Recurso não encontrado' }, { status: 404 });

// Rate limit
return NextResponse.json({ error: 'Limite atingido', dailyLimit, used }, { status: 429 });

// Erro interno
return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
```

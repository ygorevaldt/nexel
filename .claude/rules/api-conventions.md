# API Conventions — Nexel

## Estrutura de uma API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
// Imports de repositories — nunca de Models diretamente

// Constantes no topo, fora da função
const LIMIT = 20;

// Schema Zod para validação de input (apenas em POST/PUT/PATCH)
const CreateSchema = z.object({
  field: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    // 1. Autenticação (se necessário)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Leitura de query params
    const { searchParams } = req.nextUrl;
    const param = searchParams.get('param');

    // 3. Lógica via Repository
    const data = await findSomething(session.user.id);
    if (!data) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    // 4. Retorno
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GET /api/rota]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Validação do body
    const body = CreateSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    // 3. Lógica via Repository
    const result = await createSomething({ ...body.data, userId: session.user.id });

    // 4. Retorno com 201 para criação
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/rota]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
```

---

## Controle de Permissão por Plano

O padrão correto para verificar permissão baseada em plano:

```typescript
// Leitura do plano — usar session primeiro, DB como fallback
let viewerSubscription: 'FREE' | 'PRO' | 'SCOUT' = 'FREE';
if (session?.user?.id) {
  if (session.user.subscriptionStatus) {
    viewerSubscription = session.user.subscriptionStatus as 'FREE' | 'PRO' | 'SCOUT';
  } else {
    const viewer = await findUserById(session.user.id);
    viewerSubscription = viewer?.subscriptionStatus ?? 'FREE';
  }
}

// Gates de permissão — constantes descritivas
const isOwnProfile = viewerId !== null && resource.user_id.toString() === viewerId;
const canViewFullData = isOwnProfile || viewerSubscription === 'PRO' || viewerSubscription === 'SCOUT';
const canViewAnalyses = isOwnProfile || viewerSubscription === 'SCOUT';
const canViewContact = viewerSubscription === 'SCOUT';
```

---

## Rotas com Parâmetros Dinâmicos

```typescript
// Next.js 16+ — params é uma Promise
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

---

## Rate Limiting

Ao implementar limites diários, seguir o padrão:

```typescript
const DAILY_LIMIT = 5;

// Verificar antes de processar
const todayCount = await countTodayOperations(userId);
if (todayCount >= DAILY_LIMIT) {
  return NextResponse.json(
    {
      error: `Limite diário de ${DAILY_LIMIT} operações atingido.`,
      dailyLimit: DAILY_LIMIT,
      used: todayCount,
    },
    { status: 429 }
  );
}
```

---

## Rotas Públicas vs Privadas

- **Pública:** não chama `auth()`, retorna dados públicos apenas
- **Privada:** chama `auth()` e retorna 401 se não autenticado
- **Semi-pública:** chama `auth()` mas não retorna 401 — apenas adapta o payload conforme o plano do viewer

`/api/feed` e `/api/ranking` são públicas.
`/api/profile/[id]` é semi-pública — retorna dados parciais para FREE anônimo.
`/api/analyze`, `/api/me/*`, `/api/subscription` são privadas.

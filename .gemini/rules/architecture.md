# Arquitetura — Nexel

## Padrão: Monolito Modular

O Nexel segue arquitetura de monolito modular. Nunca sugerir microserviços.
Cada domínio de negócio é um módulo com fronteiras claras.

---

## Módulos do Domínio

| Módulo | Responsabilidade | Arquivos principais |
|--------|-----------------|---------------------|
| `auth` | Usuário, sessão, autenticação, registro | `User.ts`, `UserRepository.ts`, `auth.ts`, `auth.config.ts` |
| `profile` | Perfil público, métricas, feed, ranking | `Profile.ts`, `ProfileRepository.ts` |
| `analysis` | Coach IA, análises Gemini, score history | `AiAnalysis.ts`, `AiAnalysisRepository.ts` |
| `challenges` | Arena de desafios, matchmaking | `Challenge.ts`, `ChallengeRepository.ts` |
| `billing` | Assinatura Stripe, transações | `Transaction.ts`, `TransactionRepository.ts` |

---

## Regras de Comunicação entre Módulos

### 1. Módulos só se comunicam via interfaces públicas (Repositories)

```typescript
// ✅ CORRETO — billing acessa dados de auth via Repository
import { findUserById } from '@/repositories/UserRepository';

// ❌ ERRADO — billing importando Model de auth diretamente
import { User } from '@/models/User';
```

### 2. API Routes não contêm lógica de negócio

API routes são finas: autenticam, validam input com Zod, delegam ao Repository, retornam resposta.
Lógica de negócio complexa fica nos Repositories ou em funções de serviço dedicadas em `lib/`.

```typescript
// ✅ CORRETO — rota fina
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = CreateChallengeSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const challenge = await createChallenge({ creator_id: session.user.id, ...body.data });
  return NextResponse.json({ data: challenge }, { status: 201 });
}

// ❌ ERRADO — lógica de negócio dentro da rota
export async function POST(req: NextRequest) {
  // ... validação misturada com queries MongoDB diretas e lógica condicional ...
  const user = await User.findById(session.user.id); // importando Model direto
  if (user.subscriptionStatus !== 'PRO') { ... }
  await Challenge.create({ ... }); // query direta sem Repository
}
```

### 3. Cada módulo é dono dos seus próprios dados

No MongoDB, collections têm prefixo do módulo quando há ambiguidade.
Nunca compartilhar collections entre módulos.
Se dois módulos precisam dos mesmos dados, um acessa via Repository do outro.

### 4. Migração progressiva

Ao modificar um arquivo existente que ainda não segue esses padrões:
- Aplique os padrões naquele arquivo
- Não refatore arquivos que não estão sendo tocados na tarefa atual
- Documente no commit o que foi refatorado

---

## Estrutura de um Repository

Todo Repository segue este padrão:

```typescript
import dbConnect from '@/lib/db';
import { ModelName, IModelName } from '@/models/ModelName';

// Funções nomeadas descritivamente — sem classes, sem métodos estáticos
export async function findXxxByYyy(param: string): Promise<IModelName | null> {
  await dbConnect(); // sempre chamar antes de qualquer query
  return ModelName.findOne({ field: param }).lean(); // .lean() para leitura
}

export async function createXxx(data: CreateXxxInput): Promise<IModelName> {
  await dbConnect();
  return ModelName.create(data); // sem .lean() em criação — retorna documento completo
}

export async function updateXxx(id: string, data: Partial<IModelName>): Promise<IModelName | null> {
  await dbConnect();
  return ModelName.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
}
```

Regras dos Repositories:
- Sempre `await dbConnect()` antes de qualquer operação
- Usar `.lean()` em queries de leitura para melhor performance
- Funções nomeadas com verbos descritivos: `findXxx`, `createXxx`, `updateXxx`, `deleteXxx`, `countXxx`
- Sem lógica de negócio — apenas acesso a dados
- Sem tratamento de erros internos — deixar propagar para a rota tratar

---

## Estrutura de um Model Mongoose

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Interface do documento
export interface IModelName extends Document {
  field: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Schema com tipos explícitos
const ModelNameSchema: Schema<IModelName> = new Schema(
  {
    field: { type: String, required: true },
  },
  { timestamps: true } // sempre incluir timestamps
);

// 3. Índices declarados fora do Schema
ModelNameSchema.index({ field: 1 });

// 4. Export com proteção de hot-reload do Next.js
export const ModelName: Model<IModelName> =
  mongoose.models.ModelName || mongoose.model<IModelName>('ModelName', ModelNameSchema);
```

---

## Validação de Input com Zod

Toda rota POST/PUT/PATCH deve validar o body com Zod antes de qualquer operação.

```typescript
import { z } from 'zod';

const CreateChallengeSchema = z.object({
  type: z.enum(['1v1', '4v4']),
  difficulty: z.enum(['BRONZE', 'SILVER', 'GOLD', 'DIAMOND']),
});

// Na rota:
const parsed = CreateChallengeSchema.safeParse(await req.json());
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
// Usar parsed.data — tipado e validado
```

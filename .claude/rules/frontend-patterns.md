# Frontend Patterns — Nexel

## Server Components vs Client Components

Next.js App Router usa Server Components por padrão. Mantenha esse padrão.

### Use Server Components para:
- Fetch de dados (pages, layouts)
- Conteúdo estático
- SEO-sensitive content

### Use Client Components (`"use client"`) apenas quando necessário:
- Interatividade com estado (`useState`, `useEffect`)
- Event handlers (`onClick`, `onChange`)
- Hooks do browser (`useRouter`, `useSession`)
- Animações com Framer Motion

```typescript
// ✅ Server Component — busca dados no servidor
export default async function ProfilePage({ params }) {
  const data = await fetchProfile(params.id);
  return <ProfileHeader profile={data} />;
}

// ✅ Client Component — só quando precisa de interatividade
'use client';
export function AnalysisList({ initialAnalyses, profileId }) {
  const [page, setPage] = useState(1);
  // ...
}
```

---

## Organização de Componentes

### Componentes de página: `_components/` co-localizados

Componentes usados apenas em uma página ficam na pasta `_components/` dessa página.

```
src/app/profile/[id]/
├── page.tsx
└── _components/
    ├── ProfileHeader.tsx    → usado só nesta página
    ├── ScoreCards.tsx
    └── UpgradeCTA.tsx
```

### Componentes compartilhados: `src/components/`

```
src/components/
├── layout/       → Navbar, Footer, Providers
└── ui/           → Shadcn/UI — NÃO EDITAR diretamente
```

Se um componente de `_components/` precisar ser reutilizado em outra página, mova para `src/components/`.

---

## Tipagem de Props

Sempre use `interface` para props de componentes.

```typescript
// ✅ CORRETO
interface ProfileHeaderProps {
  profile: {
    nickname: string;
    rank: string;
    global_score: number;
    plan: 'FREE' | 'PRO' | 'SCOUT';
    is_own_profile: boolean;
  };
}

export function ProfileHeader({ profile }: ProfileHeaderProps) { ... }

// ❌ ERRADO — type inline no JSX
export function ProfileHeader({ profile }: { profile: any }) { ... }
```

---

## Funções Auxiliares em Componentes

Funções puras que calculam estilos ou transformam dados ficam fora do componente, no topo do arquivo.

```typescript
// ✅ CORRETO — função pura fora do componente
function getScoreColor(score: number): string {
  if (score >= 71) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

export function ScoreDisplay({ score }: { score: number }) {
  return <span className={getScoreColor(score)}>{score}</span>;
}

// ❌ ERRADO — lógica inline no JSX
export function ScoreDisplay({ score }: { score: number }) {
  return (
    <span className={score >= 71 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}>
      {score}
    </span>
  );
}
```

---

## Estados de Loading e Empty

Todo componente que busca dados deve ter estado de loading e estado vazio explícitos.

```typescript
// Loading com Skeleton
if (loading) {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
      ))}
    </div>
  );
}

// Empty state com contexto e ação
if (items.length === 0) {
  return (
    <div className="py-12 text-center">
      <IconName className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
      <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>
    </div>
  );
}
```

---

## Animações com Framer Motion

Use Framer Motion apenas em Client Components.
Padrão de entrada para listas e cards:

```typescript
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
>
  {children}
</motion.div>
```

Em Server Components, use CSS animation via Tailwind:
```tsx
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
  {children}
</div>
```

---

## Shadcn/UI

- **Nunca edite** os arquivos em `src/components/ui/` diretamente
- Use os componentes como estão: `Card`, `Badge`, `Button`, `Avatar`, `Tabs`, etc.
- Para customizar aparência, use as props `className` com Tailwind
- Para adicionar novo componente Shadcn: `npx shadcn add [component-name]`

---

## Formulários e Feedback ao Usuário

- Use `sonner` (toast) para feedback de ações: sucesso, erro, loading
- Toast de loading enquanto aguarda resposta assíncrona
- Toast de sucesso ou erro após resolver

```typescript
import { toast } from 'sonner';

// Padrão para ações assíncronas
const handleAction = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/endpoint', { method: 'POST', ... });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? 'Erro ao executar ação');
      return;
    }
    toast.success('Ação concluída com sucesso!');
  } catch {
    toast.error('Erro de conexão. Tente novamente.');
  } finally {
    setLoading(false);
  }
};
```

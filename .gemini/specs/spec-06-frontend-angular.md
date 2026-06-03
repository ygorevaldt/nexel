# Spec 06: Frontend Angular (Modern UI, Signals & Core Pages)

Esta especificação orienta a reconstrução completa da interface visual e fluxo de navegação do Nexel no frontend `scout-hub` utilizando Angular Standalone Components, Tailwind CSS v4, Angular Signals para gerenciamento de estado e Angular Animations nativas.

---

## 1. Escopo de Trabalho
1. Configurar o bootstrap do Angular com Tailwind CSS v4 no arquivo `styles.css`.
2. Implementar as rotas da aplicação em `app.routes.ts` com proteção de acessos via Guards Angular.
3. Desenvolver os serviços de consumo de API usando `HttpClient` e integrando com signals usando `toSignal`.
4. Reconstruir as 6 páginas principais da plataforma utilizando componentes modulares standalone de `libs/`.

---

## 2. Configuração de Rotas e Guards Reativos

O sistema de rotas fará uso de Guards funcionais nativos do Angular para bloquear acessos a rotas sensíveis baseado no JWT armazenado no estado ou no cookie seguro:

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { subscriptionGuard } from './guards/subscription.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  
  // Rotas Protegidas
  { 
    path: 'coach-ia', 
    loadComponent: () => import('./pages/coach-ia/coach-ia.component').then(m => m.CoachIaComponent),
    canActivate: [authGuard, subscriptionGuard],
    data: { requiredPlans: ['PRO', 'SCOUT'] }
  },
  { 
    path: 'feed', 
    loadComponent: () => import('./pages/feed/feed.component').then(m => m.FeedComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'profile/:id', 
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'feed' }
];
```

---

## 3. Mapeamento das Telas a Serem Portadas

### 1. Login / Registro
- Design minimalista e elegante com tema escuro de alto contraste.
- Formulario reativo integrado e consumo dos tokens JWT, salvando o estado no `AuthStore` baseado em Signals.

### 2. Dashboard Coach IA
- Campo de busca ou seleção para carregar a partida recente do jogador pelo `matchId` e plataforma.
- Tela com animação de carregamento (Lottie ou CSS puro baseado em `@keyframes` e transições de opacidade Angular).
- Painel de Scores interativo: Revelação de scores (Movimentação, Combate, Rotação) animando as barras de 0 até o valor recebido por meio de Angular Animations.
- Feedback do Coach estruturado em blocos colapsáveis ricos com micro-interações de clique.

### 3. Vitrine de Talentos (Feed)
- Cartões de perfil com design de vidro (glassmorphism), bordas brilhantes sutis e efeito hover 3D (usando transformações CSS com Tailwind).
- Barra lateral de filtros instantâneos baseados em inputs Signals que disparam novas listagens de forma reativa.

### 4. Perfil Público
- Divisão inteligente baseada no nível do viewer:
- Viewer `FREE` visualizando terceiros: Oculta scores detalhados sob blur e exibe um modal ou card premium dinâmico convidando a assinar o plano `PRO` para revelar a análise do jogador.
- Viewer `PRO`/`SCOUT`: Revela dados de contato (SCOUT) e gráficos interativos de pizza ou radar (representando Movimentação, Combate e Rotação) criados puramente via SVGs dinâmicos reativos às variáveis do Signal.

### 5. Leaderboard (Ranking Global)
- Exibição de tabela interativa de classificação.
- Destaque premium em formato de pódio tridimensional para o Top 3 jogadores, carregando imagens e estatísticas.

### 6. Assinaturas e Planos
- Cards de planos comparativos (`PRO` vs `SCOUT`) com tabelas de recursos e botão dinâmico integrado para chamar a API de Stripe Checkout do NestJS.

---

## 4. Gerenciamento de Animações Substitutas

Toda micro-animação deve ser limpa e expressa nos metadados do componente. Exemplo de animação de entrada sequencial (Stagger) para itens do feed de talentos:

```typescript
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger('50ms', [
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);
```

---

## 5. Garantia de Qualidade e Testes (Vitest)
- Executar testes unitários de componentes em Angular utilizando o test runner **Vitest** integrado com `@analogjs/vite-plugin-angular` (ou o compilador Vite nativo do ecossistema do Nx Monorepo).
- Garantir que todos os services do frontend tenham mocks de requisição HTTP consistentes.

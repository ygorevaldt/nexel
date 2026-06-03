# Regras de Frontend — Angular Standalone & Modern UI

Este documento estabelece as diretrizes obrigatórias de engenharia de frontend para o desenvolvimento da aplicação `scout-hub` utilizando a stack moderna do Angular.

---

## 1. Componentes Standalone (Zero NgModules)

- Todos os componentes, diretivas e pipes devem ser obrigatoriamente configurados com `standalone: true`.
- NUNCA usar arquivos de módulo do tipo `*.module.ts` tradicionais do Angular.
- As dependências externas (outros componentes, diretivas ou módulos comuns como `CommonModule` ou `RouterModule`) devem ser explicitadas diretamente no array `imports` do decorator `@Component()` correspondente:

```typescript
@Component({
  selector: 'app-score-panel',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './score-panel.component.html',
  styleUrls: ['./score-panel.component.css'],
})
export class ScorePanelComponent {}
```

---

## 2. Reatividade de Estado com Angular Signals

- Para estados locais de componentes, gerenciamento de dados de exibição e valores computados, **Signals é a preferência absoluta**.
- Evitar o acúmulo de fluxos complexos baseados em observables RxJS puramente para exibição de variáveis simples em templates.
- **Integração HttpClient + Signals**:
  - Requisições HTTP baseadas em observables provenientes do `HttpClient` do Angular devem ser integradas de maneira fluida e convertidas para signals usando a função utilitária `toSignal` do pacote `@angular/core/rxjs-interop`:

```typescript
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProfileService } from '@nexel/domain-profile';

@Component({
  selector: 'app-scout-feed',
  standalone: true,
  template: `
    <div class="grid grid-cols-3 gap-6">
      @for (profile of profiles(); track profile.id) {
        <app-profile-card [profile]="profile" />
      }
    </div>
  `
})
export class ScoutFeedComponent {
  private profileService = inject(ProfileService);
  
  // Converte o Observable de requisição HTTP diretamente para um Signal reativo
  profiles = toSignal(this.profileService.getFeed(), { initialValue: [] });
}
```

---

## 3. Estilização Moderna com Tailwind CSS v4

- O Tailwind CSS v4 deve ser configurado no root da aplicação Angular (`apps/scout-hub/src/styles.css`).
- Adotar as novas diretivas CSS nativas do Tailwind v4 (`@theme`, etc.) para a customização do design system.
- O frontend do Nexel deve continuar transmitindo uma experiência **premium** de altíssimo valor de design:
  - Uso abundante de glassmorphism (fundos translúcidos com `backdrop-blur`).
  - Gradientes dinâmicos de cor e contrastes de tema escuro elegantes.
  - Efeitos interativos fluidos no hover e active de botões e cards de talentos.

---

## 4. Transição para Angular Animations (Substituição de Framer Motion)

- O uso de Framer Motion do React é completamente substituído pelas **Angular Animations** nativas.
- As transições e micro-animações dinâmicas devem ser declaradas no array `animations` do decorator do componente:

```typescript
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-analysis-details',
  standalone: true,
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div [@fadeInUp] class="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
      <!-- Conteúdo rica da análise -->
    </div>
  `
})
export class AnalysisDetailsComponent {}
```

- Animações ricas e fluidas devem ser mantidas ao abrir abas, revelar gráficos de scores e no carregamento da análise de IA para impressionar o usuário.

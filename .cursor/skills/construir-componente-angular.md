---
name: construir-componente-angular
description: Habilidade para criar e programar Componentes Standalone reativos baseados em Angular Signals, Tailwind CSS v4 e animações nativas no frontend.
trigger: "Quando for necessário criar uma nova página, card, dashboard ou qualquer bloco de UI no frontend scout-hub."
---

# Skill: Construir Componente Angular

## Contexto de Uso
Utilize esta habilidade para desenhar qualquer peça de interface visual do Nexel. Todos os componentes devem ser independentes (Standalone), fáceis de testar e visualmente deslumbrantes (glassmorphism/premium design).

---

## Processo Sequencial de Execução

### Passo 1 — Executar a Geração via CLI do Angular
Gere a estrutura básica do componente utilizando a CLI oficial integrada ao Nx, garantindo que seja standalone e possua sua própria folha de estilo CSS:

```bash
npx nx g @nx/angular:component <nome-do-componente> --project=scout-hub --standalone --style=css
```

> ⚠️ **Atenção:** Substitua `<nome-do-componente>` pelo nome em kebab-case. O gerador criará a pasta física com o component `.ts`, o template `.html`, folha `.css` e os arquivos de teste unitário `.spec.ts`.

---

### Passo 2 — Configurar a Estrutura Standalone e Dependências
Abra a classe do componente e declare as dependências de outros componentes ou utilitários comuns (como `CommonModule`, `NgIconComponent`) explicitamente dentro da propriedade `imports` do decorator `@Component()`:

```typescript
// Exemplo Gold Standard: apps/scout-hub/src/app/components/score-panel/score-panel.component.ts
import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-panel.component.html',
  styleUrls: ['./score-panel.component.css']
})
export class ScorePanelComponent {
  // Input obrigatório estrito do Angular
  @Input({ required: true }) baseScore!: number;

  // Signal de estado interno
  multiplier = signal<number>(1.2);

  // Signal Computado reativo
  finalScore = computed(() => Math.round(this.baseScore * this.multiplier()));

  incrementMultiplier() {
    this.multiplier.update(v => v + 0.1);
  }
}
```

---

### Passo 3 — Aplicar Estilização Premium (Tailwind v4)
No template HTML correspondente (`.component.html`), desenhe o design de alto nível característico do Nexel:
- Use `backdrop-blur-md` e bordas translúcidas para criar o efeito de vidro (glassmorphism).
- Use gradientes táticos elegantes de cores harmonizadas.

```html
<!-- Exemplo Gold Standard: apps/scout-hub/src/app/components/score-panel/score-panel.component.html -->
<div class="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/60 p-6 rounded-3xl transition-all duration-300 hover:border-emerald-500/30">
  <div class="flex justify-between items-center">
    <h3 class="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Score Calculado</h3>
    <span class="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-mono">x{{ multiplier() | number:'1.1-2' }}</span>
  </div>
  
  <div class="mt-4 flex items-baseline gap-2">
    <span class="text-4xl font-extrabold text-white tracking-tight">{{ finalScore() }}</span>
    <span class="text-zinc-500 text-xs">PTS</span>
  </div>
  
  <button 
    (click)="incrementMultiplier()" 
    class="w-full mt-6 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-2xl transition-all duration-200 active:scale-95 shadow-lg shadow-emerald-500/10">
    Aumentar Multiplicador
  </button>
</div>
```

---

### Passo 4 — Integrar Animações Nativas do Angular
- **NUNCA instale ou utilize bibliotecas baseadas em React (como Framer Motion).**
- Declare as transições visuais de forma nativa no componente usando `@angular/animations`:

```typescript
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-score-panel',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('revealAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  templateUrl: './score-panel.component.html',
  styleUrls: ['./score-panel.component.css']
})
export class ScorePanelComponent {
  // ... lógica
}
```

No HTML, aplique a animação ao elemento raiz:
```html
<div [@revealAnimation] class="bg-zinc-900/50 ...">
  <!-- ... -->
</div>
```

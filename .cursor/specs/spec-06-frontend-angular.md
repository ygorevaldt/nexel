# Spec 06: Frontend Angular (Modern UI, Signals, i18n & Mapa Tático)

Esta especificação orienta a reconstrução completa da interface visual e fluxo de navegação do Nexel no frontend `scout-hub` utilizando Angular Standalone Components, Tailwind CSS v4, Angular Signals para gerenciamento de estado e i18n, além da renderização premium do Mapa Tático de telemetria de partidas do PUBG.

---

## 1. Escopo de Trabalho
1. Configurar o bootstrap do Angular com Tailwind CSS v4 no arquivo `styles.css`.
2. Implementar as rotas da aplicação em `app.routes.ts` com proteção de acessos via Guards Angular.
3. Desenvolver a **Estratégia de Internacionalização (i18n)** nativa usando Angular Signals para troca dinâmica de idioma (Português/Inglês) sem recarregar a página.
4. Criar o componente premium **Mapa Tático de Telemetria (Interactive Tactical Map)** usando HTML5 Canvas/SVG para desenhar trajetórias, zonas e tiroteios.
5. Desenvolver os gráficos de **Evolução Semanal** de K/D e taxas de vitória baseados em SVGs dinâmicos reativos aos Signals.
6. Reconstruir as 6 páginas principais da plataforma utilizando componentes modulares standalone de `libs/`.

---

## 2. Internacionalização Baseada em Signals (i18n)

Para suportar o público global (Português/Inglês) desde o dia 1, criaremos um `I18nStore` global utilizando Signals para gerenciar e traduzir as strings na UI.

```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class I18nStore {
  readonly currentLang = signal<'pt' | 'en'>('pt');

  private readonly translations = {
    pt: {
      WELCOME: 'Bem-vindo ao Nexel',
      COACH_FEEDBACK: 'Feedback do Coach de Elite',
      TACTICAL_MAP: 'Mapa Tático da Partida',
      WEEKLY_EVOLUTION: 'Evolução Semanal',
      UPGRADE_PLAN: 'Fazer Upgrade de Plano',
      MOV_SCORE: 'Movimentação',
      COMBAT_SCORE: 'Combate',
      ROT_SCORE: 'Rotação'
    },
    en: {
      WELCOME: 'Welcome to Nexel',
      COACH_FEEDBACK: 'Elite Coach Feedback',
      TACTICAL_MAP: 'Match Tactical Map',
      WEEKLY_EVOLUTION: 'Weekly Evolution',
      UPGRADE_PLAN: 'Upgrade Subscription Plan',
      MOV_SCORE: 'Movement',
      COMBAT_SCORE: 'Combat',
      ROT_SCORE: 'Rotation'
    }
  };

  // Signal computado para expor as chaves de tradução ativas
  readonly t = computed(() => this.translations[this.currentLang()]);

  setLanguage(lang: 'pt' | 'en') {
    this.currentLang.set(lang);
    localStorage.setItem('nexel_lang', lang);
  }
}
```

No template do componente Angular:
```html
<h1>{{ i18n.t().WELCOME }}</h1>
<button (click)="i18n.setLanguage('en')">EN</button>
```

---

## 3. Mapeamento das Telas e Componentes Premium

### 1. Dashboard Coach IA e Mapa Tático
* O usuário seleciona uma partida. A telemetria JSON é carregada no frontend.
* **Componente `TacticalMapComponent`**:
  - Exibe como plano de fundo a imagem do mapa da partida (ex: `erangel.jpg`).
  - Utiliza `<canvas>` ou `<svg>` sobreposto em tamanho responsivo.
  - **Conversão de Coordenadas**: As posições da API do PUBG são fornecidas em coordenadas espaciais de `0` a `810000`. O componente aplica uma regra de três simples para escalar as posições para a largura e altura do container (ex: `x_canvas = (x_pubg / 810000) * canvas_width`).
  - Desenha:
    * Uma linha conectando as coordenadas `LogPlayerPosition` consecutivas do jogador (trajetória de rotação).
    * Círculos SVG concêntricos representando as fronteiras da Safe Zone (círculo azul e branco) a cada Fase da partida.
    * Ícones de mira vermelha nos pontos de combate (`LogPlayerAttack` / `LogPlayerTakeDamage`) e um ícone de caveira onde o jogador faleceu.

### 2. Perfil Público e Gráficos Semanais
* **Evolução Semanal**: Em vez de bibliotecas pesadas de terceiros, os gráficos de evolução de K/D e taxas de vitória semanais serão desenhados com **SVGs Táticos Reativos**.
* O componente gera uma tag `<svg viewBox="0 0 500 200">` e constrói dinamicamente a propriedade `d` da tag `<path>` (ex: `d="M 0 120 L 100 80 L 200 110 ..."`), interpolando as estatísticas históricas dos Signals de K/D semanal do jogador.
* **Blur para Usuários Free**: Se o visualizador for `FREE` analisando o perfil de outro jogador, as estatísticas avançadas de IA e os detalhes do mapa tático serão cobertos por um filtro de blur CSS (`backdrop-filter: blur(10px)`) com um banner CTA premium centralizado.

### 3. Leaderboard (Ranking Global)
* Exibe a tabela de classificação tática baseada em scores verificados (K/D, média de sobrevivência).
* Pódio tridimensional em SVG/CSS para destacar o Top 3.

---

## 4. Animações e Transições
Exemplo de animação de entrada sequencial (Stagger) para itens do feed de talentos e de revelação dos scores:

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
- Testar a reatividade do `I18nStore`: validar se a alteração do Signal `currentLang` altera dinamicamente o texto exibido nas chaves traduzidas.
- Validar se a função de mapeamento de coordenadas do mapa calcula a proporção correta com base no tamanho do container.

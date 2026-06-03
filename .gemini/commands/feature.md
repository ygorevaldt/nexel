Implemente a seguinte feature no Nexel seguindo rigorosamente os padrões do projeto:

**Feature:** $ARGUMENTS

## Passo 0 — Criar branch (OBRIGATÓRIO, antes de qualquer código)

Gere um nome de branch em kebab-case com base na descrição da feature em $ARGUMENTS
(ex: "análise de replay" → `feature/analise-de-replay`) e execute:

```bash
git checkout master && git pull && git checkout -b feature/<nome-gerado>
```

Nunca implemente diretamente na master.

---

Antes de escrever qualquer código, leia e siga as regras do workspace:
- `.cursor/rules/nomenclatura-e-estrutura.mdc` — estrutura de pastas do Nx, aliases e acoplamento zero.
- `.cursor/rules/backend-nestjs.mdc` — convenções do backend NestJS, injeção de dependência e Mongoose.
- `.cursor/rules/frontend-angular.mdc` — convenções de templates Angular, Signals e standalone components.
- `.cursor/rules/ai-usage.mdc` — regras de integração caso a feature acione IA (Gemini).

**Checklist obrigatório antes de finalizar:**
- [ ] Geração de novos artefatos feita via CLI (Nx/Angular/Nest CLI)
- [ ] Controllers da API são finos — delegam lógica para Services/Repositories
- [ ] Nenhum Model Mongoose importado diretamente fora da camada de persistência (Repository/Service)
- [ ] Validação de payload via DTOs decorados com `class-validator` em todas as rotas POST/PUT/PATCH do NestJS
- [ ] Controle de acesso e permissões implementado via Guards do NestJS
- [ ] Sem valores mágicos — constantes nomeadas no topo ou em arquivo de constantes
- [ ] TypeScript strict ativo — sem `any` e sem `!` sem justificativa
- [ ] Componentes Angular criados como Standalone, importando explicitamente suas dependências no decorator
- [ ] Gerenciamento de estado e reatividade no frontend baseados em Angular Signals
- [ ] Estilização premium baseada em Tailwind CSS v4, mantendo glassmorphism e micro-animações
- [ ] Transições visuais construídas nativamente com Angular Animations (zero Framer Motion)
- [ ] Sem comentários explicando o óbvio

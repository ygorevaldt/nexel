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

Antes de escrever qualquer código, leia e siga:
- `@.claude/rules/architecture.md` — estrutura de módulos e responsabilidades
- `@.claude/rules/api-conventions.md` — padrão das API routes
- `@.claude/rules/code-style.md` — TypeScript e clean code
- `@.claude/rules/frontend-patterns.md` — componentes React e Next.js
- `@.claude/rules/ai-usage.md` — se a feature envolver Gemini

**Checklist obrigatório antes de finalizar:**
- [ ] API routes são finas — delegam para Repositories
- [ ] Nenhum Model importado diretamente fora do Repository
- [ ] Validação de input com Zod em todas as rotas POST/PUT/PATCH
- [ ] Controle de permissão server-side baseado em `subscriptionStatus`
- [ ] Sem valores mágicos — constantes nomeadas
- [ ] TypeScript strict — sem `any`, sem `!` injustificado
- [ ] Tratamento de erro com try/catch e log com prefixo `[MÉTODO /rota]`
- [ ] Estados de loading e empty em componentes que buscam dados
- [ ] Sem comentários explicando o óbvio
- [ ] `README.md` atualizado refletindo a feature (seções afetadas: funcionalidades, stack, rotas de API)

Implemente de forma progressiva e confirme cada arquivo antes de avançar para o próximo.

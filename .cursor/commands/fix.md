Analise e corrija o seguinte problema no Nexel:

**Problema:** $ARGUMENTS

**Processo:**
1. Explique a causa raiz antes de tocar em qualquer código, aproveitando sua janela de contexto para analisar componentes afetados indiretamente.
2. Identifique qual arquivo(s) está causando o problema.
3. Proponha a correção e aguarde confirmação antes de aplicar.
4. Após aplicar, execute o build do projeto afetado ou do workspace para garantir que não introduziu erros de compilação ou de tipo (ex: `npx nx build api` ou `npx nx build scout-hub`).
5. Explique o que mudou e por que resolve o problema.

**Restrições:**
- Não refatore código que não está diretamente relacionado ao problema.
- Se a correção exigir mudança arquitetural maior, documente a dívida técnica em vez de fazer um contorno ("gambiarra").
- Siga estritamente as regras de `@.cursor/rules/nomenclatura-e-estrutura.mdc`, `@.cursor/rules/backend-nestjs.mdc` e `@.cursor/rules/frontend-angular.mdc` na correção.

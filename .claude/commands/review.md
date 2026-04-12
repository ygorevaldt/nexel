Faça uma revisão completa das mudanças que acabei de fazer. Analise:

1. **Arquitetura:** As API routes usam Repositories? Algum Model sendo importado diretamente fora do Repository? Alguma lógica de negócio dentro da rota que deveria estar no Repository?

2. **TypeScript:** Algum uso de `any` implícito? Algum `!` não justificado? Tipos poderiam ser mais precisos?

3. **Segurança:** Inputs estão sendo validados com Zod antes de chegar ao banco? Rotas privadas chamam `auth()` e verificam sessão? Algum dado sensível sendo exposto sem verificação de permissão?

4. **Clean Code:** Existe algum valor mágico que deveria ser uma constante? Alguma função fazendo mais de uma coisa? Algum comentário desnecessário explicando o óbvio?

5. **Padrões do projeto:** O código segue os padrões definidos em `@.claude/rules/`? O formato de resposta das APIs está consistente?

Contexto das mudanças: $ARGUMENTS

Seja direto. Liste o que está errado e o que está certo. Se tudo estiver ok, diga isso claramente.

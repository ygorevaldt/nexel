Faça uma auditoria de segurança no seguinte contexto do Nexel:

**Escopo:** $ARGUMENTS

Verifique especificamente:

1. **Controle de acesso:** Rotas privadas verificam `auth()` antes de qualquer operação? Dados de outros usuários estão protegidos corretamente por `subscriptionStatus`?

2. **Exposição de dados sensíveis:** `contact_info` (discord/whatsapp) só é retornado para viewers com `SCOUT`? Análises de IA completas só visíveis para o próprio usuário ou SCOUT?

3. **Validação de input:** Todos os campos de entrada passam por validação Zod antes de chegar ao banco? Existe proteção contra ObjectId inválido antes de queries por ID?

4. **IDOR (Insecure Direct Object Reference):** É possível acessar recursos de outro usuário apenas trocando um ID na URL ou no body?

5. **Variáveis de ambiente:** Alguma chave (Stripe, Gemini, MongoDB) está sendo exposta no cliente? Variáveis `NEXT_PUBLIC_` contêm apenas o que pode ser público?

6. **Rate limiting:** Features com custo (análises Gemini, envios de Booyah) têm proteção de limite diário verificada server-side?

Liste vulnerabilidades encontradas com severidade (Alta/Média/Baixa) e como corrigir cada uma.

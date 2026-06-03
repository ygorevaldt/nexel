Faça uma auditoria de segurança no seguinte contexto do Nexel:

**Escopo:** $ARGUMENTS

Verifique especificamente:

1. **Controle de Acesso (NestJS):** Rotas privadas verificam JWT/sessão via Guards? A verificação de permissão baseada em `subscriptionStatus` (FREE, PRO, SCOUT) está ativa server-side antes de retornar informações restritas?
2. **Exposição de Dados Sensíveis:** `contact_info` (discord/whatsapp) de jogadores é retornado apenas para usuários com perfil `SCOUT`? Análises de IA completas só podem ser acessadas pelo próprio jogador ou por scouts?
3. **Validação de Entrada:** Todos os payloads de entrada passam por validação estrita baseada em DTOs com `class-validator`? Existe validação contra IDs do MongoDB (ObjectId) inválidos antes de consultas por ID no Mongoose para prevenir quebras ou injeções?
4. **IDOR (Insecure Direct Object Reference):** É possível alterar ou visualizar recursos de outro jogador simplesmente manipulando IDs no payload ou na URL (ex: `accountId` ou `matchId`)? O backend valida se o recurso pertence ao usuário logado?
5. **Variáveis de Ambiente:** Alguma chave de acesso privada (Stripe, Gemini API, MongoDB Atlas URL) está vazando ou sendo exposta para o cliente no build do Angular?
6. **Rate Limiting & Custos:** Funcionalidades que consomem créditos de IA (Gemini API) ou que realizam chamadas pesadas ao PUBG possuem proteção de limites diários e consumo validados server-side?

Liste as vulnerabilidades encontradas com severidade (Alta/Média/Baixa) e como corrigir cada uma de forma limpa seguindo o design do projeto.

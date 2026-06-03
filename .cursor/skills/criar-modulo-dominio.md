---
name: criar-modulo-dominio
description: Habilidade para guiar a criação determinística de um novo módulo de domínio (horizontal) no backend.
trigger: "Quando o usuário ou a especificação solicitar a inicialização de um novo domínio de negócio ou módulo no backend."
---

# Skill: Criar Módulo de Domínio

## Contexto de Uso
Utilize esta habilidade no início do desenvolvimento de um novo recurso ou domínio de negócio. O objetivo é inicializar fisicamente a biblioteca no monorepo Nx de forma idempotente, gerando a estrutura de diretórios padronizada de Services, Controllers e Repositories.

---

## Processo Sequencial de Execução

### Passo 1 — Executar o Script Determinístico
Execute no terminal o script em Node.js criado especificamente para scaffolding seguro, substituindo `<nome-do-modulo>` pelo nome do domínio desejado em kebab-case:

```bash
node scripts/generate-module.js <nome-do-modulo>
```

> 💡 **Nota de Idempotência:** Se a pasta da biblioteca já existir, o script detectará automaticamente e criará apenas as pastas de infraestrutura internas ausentes, sem sobrescrever códigos existentes.

---

### Passo 2 — Registrar o Módulo no Container NestJS
Uma vez criada a biblioteca e seu arquivo de módulo correspondente (ex: `libs/domain/<nome>/src/lib/domain-<nome>.module.ts`), ele deve ser importado e registrado na aplicação principal do backend.

1. Abra o arquivo de módulo central do backend: [app.module.ts](file:///c:/Users/ygore/Documents/1-projetos/nexel/apps/api/src/app.module.ts) (ou o módulo correspondente da API).
2. Adicione a importação absoluta utilizando o alias do Nx configurado no workspace:
   ```typescript
   import { DomainNomeModule } from '@nexel/domain-nome';
   ```
3. Registre o módulo no array `imports` do decorator `@Module()`.

---

### Passo 3 — Verificar a Integridade do Monorepo
Rode o comando de compilação do Nx para validar se o novo alias do tsconfig foi indexado corretamente e se não há problemas de compilação:

```bash
npx nx build api
```

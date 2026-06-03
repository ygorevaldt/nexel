# Spec 01: Shared Workspace (Nx Monorepo & Database Schemas)

Esta especificação orienta a criação do workspace Nx Monorepo e a migração completa dos schemas Mongoose do Nexel para classes TypeScript puras decoradas no ecossistema NestJS.

---

## 1. Escopo de Trabalho
1. Inicializar um workspace monorepo Nx limpo e moderno.
2. Criar a aplicação backend `apps/api` baseada em NestJS.
3. Criar a aplicação frontend `apps/scout-hub` baseada em Angular (Standalone por padrão).
4. Criar a biblioteca compartilhada `libs/shared/types` de tipos TypeScript e Schemas do Mongoose.
5. Converter e migrar todos os 10 schemas Mongoose legados de `src/models/` para schemas declarativos nativos do NestJS.

---

## 2. Inicialização do Nx Workspace

Executar os seguintes comandos no diretório de destino:
```bash
# Inicializa o Workspace Nx vazio
npx create-nx-workspace@latest nexel-monorepo --preset=empty --interactive=false

# Adiciona os plugins do NestJS e Angular
cd nexel-monorepo
npm install --save-dev @nx/nest @nx/angular

# Cria as aplicações
npx nx g @nx/nest:app api --directory=apps/api
npx nx g @nx/angular:app scout-hub --directory=apps/scout-hub --standalone --routing --style=css

# Cria a biblioteca compartilhada de tipos e models
npx nx g @nx/js:lib shared-types --directory=libs/shared/types
```

---

## 3. Roteiro de Migração dos Models (NestJS Mongoose)

Todos os 10 models localizados em `src/models/` da antiga base de código devem ser reescritos em TypeScript strict (`"strict": true` no `tsconfig.base.json`) sob a biblioteca `libs/shared/types` (ou sub-bibliotecas como `libs/shared/models` se necessário), adaptados para a API do PUBG.

### Lista de Migração de Models:
1. `User` (Usuário, perfil de autenticação e status de assinatura)
2. `Profile` (Métricas competitivas do jogador, contendo `pubgAccountId`, `pubgPlayerTag`, `platform`, scores técnicos agregados e histórico)
3. `AiAnalysis` (Análises geradas pelo Gemini a partir da telemetria, indexadas por `matchId`, contendo scores de Movimentação, Rotação e Combate, token usage e status)
4. `Challenge` (Desafios criados na arena, com ID de validação da partida no PUBG)
5. `Plan` (Definição dos planos PRO, SCOUT)
6. `Transaction` (Registro de faturamento, pagamentos Stripe)
7. `MatchVerification` (Logs de validação de vitórias via API do PUBG para resolver fraudes de partidas)
8. `Notification` (Notificações in-app do usuário)
9. `PlanConsentLog` (Logs de alteração e consentimento de termos e planos)
10. `PlayRequest` (Solicitação de jogo e interações na arena)

### Padrão de Classe de Schema NestJS (Exemplo para User):
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'FREE', enum: ['FREE', 'PRO', 'SCOUT'] })
  subscriptionStatus: string;

  @Prop({ default: 0 })
  welcome_analysis_credits: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

---

## 4. Centralização do Banco de Dados (DatabaseModule)

Em `libs/shared/database` (ou no próprio bootstrap da `apps/api`), configurar a conexão centralizada com o MongoDB Atlas utilizando `MongooseModule.forRootAsync` injetando variáveis de ambiente de forma segura (`process.env.MONGODB_URI`):

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

---

## 5. Critérios de Aceitação e Testes
- Typecheck estrito sem erros (`npx tsc --noEmit` na biblioteca compilável `shared-types`).
- Mapeamento correto de todos os campos MongoDB Mongoose, preservando os mesmos nomes e tipos dos bancos legados do Nexel antigo para manter a compatibilidade total dos dados legados do Atlas.
- Execução de teste unitário simples em `database.module.spec.ts` para validar o carregamento de configurações do Mongoose.

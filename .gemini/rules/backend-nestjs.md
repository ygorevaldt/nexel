# Regras de Backend — NestJS

Este documento define os padrões estritos para o desenvolvimento do backend utilizando o ecossistema NestJS no monorepo Nexel, alinhados com as práticas oficiais e diretrizes recomendadas de engenharia de software corporativa.

---

## 1. Injeção de Dependências Rigorosa

- Todo componente de lógica deve ser decorado com `@Injectable()` e gerenciado pelo container IoC (Inversão de Controle) do NestJS.
- NUNCA instanciar serviços ou repositórios de dados manualmente via operador `new`.
- A injeção de dependências deve ser feita exclusivamente via construtor:

```typescript
// ✅ CORRETO — Injeção de dependência via construtor padrão NestJS
@Injectable()
export class CoachIaService {
  constructor(
    @InjectModel(AiAnalysis.name) private readonly analysisModel: Model<AiAnalysis>,
    private readonly geminiProvider: GeminiProvider,
  ) {}
}

// ❌ ERRADO — Instanciação manual de dependência ou uso de globais estáticas
@Injectable()
export class CoachIaService {
  private geminiProvider = new GeminiProvider(); // NUNCA FAZER ISSO
}
```

---

## 2. Persistência Nativa com MongooseModule

- Abandonar o padrão antigo de conexão direta ou singleton manual de banco de dados (`dbConnect`).
- Utilizar o `@nestjs/mongoose` oficial para integrar o MongoDB.
- Definir schemas com decorators nativos do Mongoose do NestJS (`@Schema()`, `@Prop()`, `SchemaFactory`):

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

- Injetar os Models nos Services usando `@InjectModel(ClassName.name)` no construtor de forma assíncrona e limpa.

---

## 3. Isolamento de Provedores Externos (Integrations)

- Apis e serviços externos (Google Gemini, Stripe, YouTube API) NUNCA podem ser invocados diretamente de controllers ou services comuns de domínio.
- Eles devem ser encapsulados em **Providers Customizados** (ex: `GeminiProvider`, `StripeProvider`, `YoutubeProvider`) que residem no módulo correspondente ou em `libs/shared/services`.
- Estes provedores expõem interfaces tipadas e limpas, isolando segredos e manipulações de requisições http de baixo nível do restante da regra de negócio da aplicação.

---

## 4. Estrutura Modular Autocontida

- Cada domínio deve ter o seu próprio `@Module()` autocontido (ex: `AuthModule`, `ProfileModule`, `CoachIaModule`, `BillingModule`).
- Cada módulo deve declarar seus `controllers`, `providers` locais e exportar explicitamente no array `exports` apenas os serviços necessários para o consumo de outros módulos.
- A comunicação inter-módulo dar-se-á pela importação de módulos no array `imports`, evitando qualquer acoplamento de persistência cruzada.

```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }])],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService], // Expõe o serviço para outros módulos
})
export class ProfileModule {}
```

---

## 5. Autenticação e Autorização baseadas em Guards e Decorators

- A autenticação é gerida centralmente por meio de estratégias de segurança Passport (como `JwtStrategy`) e aplicada em rotas por meio de `JwtAuthGuard` customizados.
- O acesso a metadados do usuário logado (ex: obter o ID ou a Role) nas rotas dos controllers deve ser feito exclusivamente via Custom Decorators:

```typescript
// ✅ CORRETO — Uso de Guards e Decorators nativos do NestJS
@Controller('profile')
export class ProfileController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@CurrentUser() user: UserPayloadDto) {
    return this.profileService.findByUserId(user.id);
  }
}
```

- NUNCA ler ou processar cookies ou cabeçalhos brutos de sessão diretamente dentro dos controllers.

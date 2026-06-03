# Spec 05: Vitrine & Social (Scout Feed, Rankings & Favorites)

Esta especificação orienta a migração do Feed de Talentos para Scouts, o Leaderboard (Ranking Global) de pontuações de jogadores, e a lógica de interações sociais (favoritar perfis), com foco em atualizações atômicas concorrentes e integridade de dados do banco de dados Mongoose no NestJS.

---

## 1. Escopo de Trabalho
1. Criar o `SocialModule` em `libs/domain/social` contendo `SocialController` e `SocialService`.
2. Migrar o Feed de Scouts com paginação, filtros por scores técnicos (Movimentação, Combate, Rotação) e estilos de jogo.
3. Migrar o Leaderboard Global (Ranking) ordenado por score de potencial geral.
4. Implementar a lógica de favoritar perfis de jogadores por Scouts garantindo integridade de concorrência e controle na propriedade desnormalizada `favorites_count`.

---

## 2. Paginação e Filtros Eficientes de Feed (Scout Feed)

O endpoint `/social/feed` deve fornecer suporte a paginação cursor-based ou offset-based para garantir performance em bases populosas, protegendo a API do NestJS contra queries sobrecarregadas.

- Filtros disponíveis: `gameStyle` (Rusher, Sniper, etc.), `minPotentialScore` e `minCombatScore`.
- Apenas usuários com `subscriptionStatus === 'SCOUT'` ou `ADM` podem consultar informações de contato no feed. O serviço removerá dados privados para usuários `FREE` e `PRO` visualizadores se tentarem acessar a listagem pública expandida.

---

## 3. Lógica Atômica do Favorites Count (Prevenção de Concorrência)

Para gerenciar o contador de favoritos desnormalizado (`favorites_count`) no Profile do jogador, **NUNCA** ler o valor atual no backend e gravar o valor acrescido. Devemos usar queries atômicas nativas do MongoDB (`$inc`) para prevenir race conditions decorrentes de favoritamentos concorrentes em larga escala:

```typescript
@Injectable()
export class SocialService {
  constructor(
    @InjectModel(Profile.name) private readonly profileModel: Model<Profile>,
    @InjectModel(Favorite.name) private readonly favoriteModel: Model<Favorite>
  ) {}

  async toggleFavorite(scoutUserId: string, targetProfileId: string): Promise<any> {
    const existing = await this.favoriteModel.findOne({
      scoutUserId,
      targetProfileId
    });

    if (existing) {
      // 1. Remove Favorito
      await this.favoriteModel.deleteOne({ _id: existing._id });
      
      // 2. Decrementa atomicamente
      await this.profileModel.findByIdAndUpdate(targetProfileId, {
        $inc: { favorites_count: -1 }
      }, { new: true });

      return { favorited: false };
    }

    // 1. Adiciona Favorito
    await this.favoriteModel.create({ scoutUserId, targetProfileId });
    
    // 2. Incrementa atomicamente
    await this.profileModel.findByIdAndUpdate(targetProfileId, {
      $inc: { favorites_count: 1 }
    }, { new: true });

    return { favorited: true };
  }
}
```

---

## 4. Ranking Global (Leaderboard)
- Rota: `GET /social/ranking`
- Retorna os top jogadores ordenados por `overall_potential_score` de forma decrescente.
- Otimização de performance: O ranking é cacheado em memória no NestJS por meio do `CacheModule` nativo do NestJS com tempo de expiração curto (ex: 5 minutos) para evitar leituras excessivas de agregação no MongoDB Atlas.

---

## 5. Suite de Testes com Vitest
- **Teste de Paginação**: Validar limites corretos e integridade de paginação do feed.
- **Teste Concorrente de Favoritos**:
  - Simular no Vitest o disparo concorrente (usando `Promise.all`) de 10 requisições simultâneas para favoritar o mesmo jogador por scouts diferentes.
  - Verificar no final se a propriedade `favorites_count` no MongoDB do perfil do jogador incrementou exatamente para 10, sem desvios decorrentes de condições de concorrência.

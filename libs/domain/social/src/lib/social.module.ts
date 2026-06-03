import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { Favorite, FavoriteSchema } from '@nexel/shared-types';
import { ProfileModule } from '@nexel/domain-profile';
import { AuthModule } from '@nexel/domain-auth';
import { SocialController } from './controllers/social.controller';
import { SocialService } from './services/social.service';
import { MongooseFavoriteRepository } from './repositories/mongoose-favorite.repository';
import { IFavoriteRepositoryToken } from './repositories/favorite.repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Favorite.name, schema: FavoriteSchema }]),
    CacheModule.register(),
    ProfileModule,
    AuthModule,
  ],
  controllers: [SocialController],
  providers: [
    SocialService,
    {
      provide: IFavoriteRepositoryToken,
      useClass: MongooseFavoriteRepository,
    },
  ],
  exports: [SocialService],
})
export class SocialModule {}

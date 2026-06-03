import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from '@nexel/shared-types';
import { PubgModule } from '@nexel/shared-pubg';
import { AuthModule } from '@nexel/domain-auth';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { MongooseProfileRepository } from './repositories/mongoose-profile.repository';
import { IProfileRepositoryToken } from './repositories/profile.repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    PubgModule,
    AuthModule,
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    {
      provide: IProfileRepositoryToken,
      useClass: MongooseProfileRepository,
    },
  ],
  exports: [ProfileService],
})
export class ProfileModule {}

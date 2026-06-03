import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from '@nexel/shared-types';
import { ProfileService } from './services/profile.service';
import { MongooseProfileRepository } from './repositories/mongoose-profile.repository';
import { IProfileRepositoryToken } from './repositories/profile.repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
  ],
  controllers: [],
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

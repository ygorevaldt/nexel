import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@nexel/domain-auth';
import { ProfileModule } from '@nexel/domain-profile';
import { CoachIaModule } from '@nexel/domain-coach-ia';
import { SocialModule } from '@nexel/domain-social';

@Module({
  imports: [
    AuthModule,
    ProfileModule,
    CoachIaModule,
    SocialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

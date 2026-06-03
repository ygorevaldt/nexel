import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@nexel/shared-database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@nexel/domain-auth';
import { ProfileModule } from '@nexel/domain-profile';
import { CoachIaModule } from '@nexel/domain-coach-ia';
import { SocialModule } from '@nexel/domain-social';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ProfileModule,
    CoachIaModule,
    SocialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

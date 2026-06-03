import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PubgApiService } from './pubg-api.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [PubgApiService],
  exports: [PubgApiService],
})
export class PubgModule {}


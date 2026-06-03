import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isTest = process.env.NODE_ENV === 'test';
        let uri = isTest
          ? configService.get<string>('MONGODB_TEST_URI')
          : configService.get<string>('MONGODB_URI');

        if (!uri) {
          throw new Error(
            isTest
              ? 'A variável MONGODB_TEST_URI não foi configurada no ambiente para a execução de testes.'
              : 'A variável MONGODB_URI não foi configurada no ambiente.'
          );
        }

        if (isTest && uri.includes('/nexel_dev')) {
          uri = uri.replace('/nexel_dev', '/nexel_test');
        }

        return { uri };

      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}

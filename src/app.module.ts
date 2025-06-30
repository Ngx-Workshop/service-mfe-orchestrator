import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MfeRemoteModule } from './mfe-remote/mfe-remote.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 5000, // Timeout in 5 seconds
      }),
    }),
    MfeRemoteModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

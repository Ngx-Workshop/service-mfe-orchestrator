import { ObservabilityModule } from './observability/observability.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AuthenticationGuard,
  NgxAuthClientModule,
  RolesGuard,
} from '@tmdjr/ngx-auth-client';
import { MfeRemoteModule } from './mfe-remote/mfe-remote.module';

const DB_IMPORTS =
  process.env.GENERATE_OPENAPI === 'true'
    ? []
    : [
        MongooseModule.forRootAsync({
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => ({
            uri: config.get<string>('MONGODB_URI'),
            serverSelectionTimeoutMS: 5000, // Timeout in 5 seconds
          }),
        }),
      ];

@Module({
  imports: [
    ObservabilityModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ...DB_IMPORTS,
    NgxAuthClientModule,
    MfeRemoteModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useExisting: AuthenticationGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
  ],
})
export class AppModule {}

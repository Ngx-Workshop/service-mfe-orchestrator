import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { NgxAuthClientModule, RemoteAuthGuard } from '@tmdjr/ngx-auth-client';
import { MfeRemoteController } from './mfe-remote.controller';
import { MfeRemoteService } from './mfe-remote.service';
import { MfeRemote, MfeRemoteSchema } from './schemas/mfe-remote.schema';

const MFE_SCHEMA_IMPORTS =
  process.env.GENERATE_OPENAPI === 'true'
    ? []
    : [
        MongooseModule.forFeature([
          { name: MfeRemote.name, schema: MfeRemoteSchema },
        ]),
      ];
// When generating OpenAPI, stub out the Mongoose model and the guard
const MFE_FAKE_PROVIDERS =
  process.env.GENERATE_OPENAPI === 'true'
    ? [
        {
          provide: getModelToken(MfeRemote.name),
          // Minimal fake the service can accept; if service calls methods during generation (it shouldn't), add no-op fns
          useValue: {
            // common Mongoose methods we might accidentally touch
            find: () => ({ exec: async () => [] }),
            findById: () => ({ exec: async () => null }),
            findByIdAndUpdate: () => ({ exec: async () => null }),
            findOne: () => ({ exec: async () => null }),
          },
        },
        {
          // In case the guard has runtime deps — make it a no-op
          provide: RemoteAuthGuard,
          useValue: { canActivate: () => true },
        },
      ]
    : [];
@Module({
  imports: [NgxAuthClientModule, ...MFE_SCHEMA_IMPORTS],
  controllers: [MfeRemoteController],
  providers: [MfeRemoteService, ...MFE_FAKE_PROVIDERS],
})
export class MfeRemoteModule {}

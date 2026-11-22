import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
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
// Schema generation must not perform persistence operations.
const MFE_FAKE_PROVIDERS =
  process.env.GENERATE_OPENAPI === 'true'
    ? [
        {
          provide: getModelToken(MfeRemote.name),
          useValue: Object.freeze({}),
        },
      ]
    : [];
@Module({
  imports: MFE_SCHEMA_IMPORTS,
  controllers: [MfeRemoteController],
  providers: [MfeRemoteService, ...MFE_FAKE_PROVIDERS],
})
export class MfeRemoteModule {}

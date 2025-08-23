import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NgxAuthClientModule } from '@tmdjr/ngx-auth-client';
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

@Module({
  imports: [NgxAuthClientModule, ...MFE_SCHEMA_IMPORTS],
  controllers: [MfeRemoteController],
  providers: [MfeRemoteService],
})
export class MfeRemoteModule {}

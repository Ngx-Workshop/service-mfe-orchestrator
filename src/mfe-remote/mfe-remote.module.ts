import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MfeRemoteController } from './mfe-remote.controller';
import { MfeRemoteService } from './mfe-remote.service';
import { MfeRemote, MfeRemoteSchema } from './schemas/mfe-remote.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MfeRemote.name, schema: MfeRemoteSchema },
    ]),
  ],
  controllers: [MfeRemoteController],
  providers: [MfeRemoteService],
})
export class MfeRemoteModule {}

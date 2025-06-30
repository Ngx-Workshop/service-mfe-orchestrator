import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MfeRemoteDocument = MfeRemote & Document;

@Schema()
export class MfeRemote extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  remoteEntryUrl: string;

  @Prop({ required: true })
  version: string;

  @Prop()
  status: string;

  @Prop({ default: 'No description provided' })
  description: string;

  @Prop({ default: Date.now })
  lastUpdated: Date;

  @Prop({ default: false })
  archived: boolean;
}

export const MfeRemoteSchema = SchemaFactory.createForClass(MfeRemote);

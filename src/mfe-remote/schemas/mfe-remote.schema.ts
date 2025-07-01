import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MfeRemoteDocument = MfeRemote & Document;

@Schema()
export class MfeRemote extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  remoteEntryUrl: string;

  @Prop({ default: 1 })
  version: number;

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

// Auto-increment version on updates
MfeRemoteSchema.pre('findOneAndUpdate', function() {
  const update = this.getUpdate() as any;
  if (update) {
    if (!update.$inc) {
      update.$inc = {};
    }
    update.$inc.version = 1;
  }
});

MfeRemoteSchema.pre('updateOne', function() {
  const update = this.getUpdate() as any;
  if (update) {
    if (!update.$inc) {
      update.$inc = {};
    }
    update.$inc.version = 1;
  }
});

MfeRemoteSchema.pre('updateMany', function() {
  const update = this.getUpdate() as any;
  if (update) {
    if (!update.$inc) {
      update.$inc = {};
    }
    update.$inc.version = 1;
  }
});

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: String, enum: ['private', 'group'], required: true })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  creator: Types.ObjectId; 

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  members: Types.ObjectId[]; 

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  lastMessage: Types.ObjectId;

  @Prop({ type: [String], required: true, ref: 'User' })
  admins: string[]; 

  @Prop({ type: String, required: true, ref: 'User' })
  createdBy: string; 

  @Prop({ type: String, default: null })
  groupName: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

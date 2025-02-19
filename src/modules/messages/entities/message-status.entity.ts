import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/modules/users/entities/user.entity';
import { Message } from './message.entity';

export type MessageStatusDocument = MessageStatus & Document;

@Schema({ timestamps: true })
export class MessageStatus {
  @Prop({ type: Types.ObjectId, ref: Message.name, required: true })
  message: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' })
  status: string; 
}

export const MessageStatusSchema = SchemaFactory.createForClass(MessageStatus);

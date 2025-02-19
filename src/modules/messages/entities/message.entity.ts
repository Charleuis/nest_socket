import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/modules/users/entities/user.entity';
import { Chat } from './chat.entity';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: Chat.name, required: true })
  chatId: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  senderId: Types.ObjectId; 

  @Prop({ type: String, required: true })
  content: string; 

  @Prop({ type: String, enum: ['text', 'image', 'video', 'audio'], default: 'text' })
  messageType: string; 

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  readBy: Types.ObjectId[]; 
}

export const MessageSchema = SchemaFactory.createForClass(Message);

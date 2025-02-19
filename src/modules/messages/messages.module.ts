import { Module } from '@nestjs/common';
import { MessagesService } from './services/messages.service';
import { MessagesController } from './controllers/messages.controller';
import { ChatSchema } from './entities/chat.entity';
import { MessageSchema } from './entities/message.entity';
import { MessageStatusSchema } from './entities/message-status.entity';
import { MessageStatus } from './entities/message-status.entity';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chat.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controllers';
import { User, UserSchema } from '../users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MessageStatus.name, schema: MessageStatusSchema },
      { name: User.name, schema: UserSchema }
    ]),
  ],
  controllers: [MessagesController, ChatController],
  providers: [MessagesService, ChatService],
})
export class MessagesModule {}

import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../entities/message.entity';
import { CreateChatDto } from '../dto/create-chat.dto';
import { Chat } from '../entities/chat.entity';
import { createResponse } from 'src/common/response/response.helper';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<Message>,
    @InjectModel(Chat.name)
    private chatModel: Model<Chat>
  ) {}

  // Send a new message
  async sendMessage(createChatDto: CreateChatDto) {
    const { receiverId, content, senderId, messageType, groupName } = createChatDto;    
    
    if (!senderId || !content) {
      throw new Error('senderId and content are required');
    }
    
    let chatId;

    // First, find or create chat
    if (receiverId) {
      const existingChat = await this.chatModel.findOne({
        members: { $all: [senderId, receiverId] },
      });

      if (existingChat) {
        chatId = existingChat._id;
      } else {
        // Create new chat
        const newChat = await this.chatModel.create({
          members: [senderId, receiverId],
          timestamp: new Date(),
          type: 'private',
          createdBy: senderId,
        });
        chatId = newChat._id;        
      }
    } else {
      if (!groupName) {
        throw new Error('groupName is required for group chats');
      }

      const existingGroupChat = await this.chatModel.findOne({
        createdBy: senderId,
        groupName: groupName,
      });
      
      if (existingGroupChat) {
        chatId = existingGroupChat._id;
      } else {
        const newGroupChat = await this.chatModel.create({
          members: [senderId],
          timestamp: new Date(),
          type: 'group',
          groupName: groupName,
          createdBy: senderId,
          admins: [senderId],
        });
        chatId = newGroupChat._id;
      }
    }
    // Then create the message
    const message = await this.messageModel.create({
      senderId,
      chatId,
      content,
      messageType,
      timestamp: new Date(),
    });

    return createResponse(HttpStatus.CREATED, 'Message sent successfully', message);
  }

  async getPrivateChat(userId: string, chatId?: string) {
    if (!chatId) {
      const userChats = await this.chatModel.find({
        members: userId
      }).select('_id');

      const messages = await this.messageModel.find({
        chatId: { $in: userChats.map(chat => chat._id) }
      }).sort({ timestamp: -1 });

      return createResponse(HttpStatus.OK, 'Messages fetched successfully', messages);
    } else {
      const messages = await this.messageModel.find({
        chatId: new Types.ObjectId(chatId)
      }).sort({ timestamp: -1 });

      if (!messages.length) {
        return createResponse(HttpStatus.NOT_FOUND, 'No messages found', []);
      }

    return createResponse(HttpStatus.OK, 'Messages fetched successfully', messages);
    }
  }

  // Delete a message
  async deleteMessage(messageId: string, userId: number): Promise<boolean> {
    const result = await this.messageModel.deleteOne({
      _id: messageId,
      senderId: userId
    });

    return result.deletedCount > 0;
  }
}

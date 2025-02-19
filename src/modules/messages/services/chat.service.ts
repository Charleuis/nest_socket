import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../entities/message.entity';
import { CreateChatDto } from '../dto/create-chat.dto';
import { Chat } from '../entities/chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<Message>,
    @InjectModel(Chat.name)
    private chatModel: Model<Chat>
  ) {}

  // Send a new message
  async sendMessage(createChatDto: CreateChatDto): Promise<Message> {
    const { receiverId, content, senderId, messageType, groupName } = createChatDto;
    console.log(createChatDto);
    
    let chatId;

    // First, find or create chat
    if (receiverId) {
        console.log("receiverId",receiverId);
        
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
          creator: senderId,
        });
        chatId = newChat._id;        
      }
    }else{
        const existingGroupChat = await this.chatModel.findOne({
            creator: senderId,
            groupName: groupName,
        });
        console.log("existingGroupChat",existingGroupChat);
        if(existingGroupChat){
            chatId = existingGroupChat._id;
        }else{
            const newGroupChat = await this.chatModel.create({
                members: [senderId],
                timestamp: new Date(),
                type: 'group',
                groupName: groupName,
                createdBy: senderId,
                admins: [senderId],
            });
            chatId = newGroupChat._id;
            console.log("newGroupChat",newGroupChat);
        }
    }
    // Then create the message
    const message = await this.messageModel.create({
      senderId,
      chatId,
      receiverId,
      content,
      messageType,
      timestamp: new Date(),
    });

    return message;
  }

  // Get chat history between two users
  async getChatHistory(user1Id: number, user2Id: number): Promise<Message[]> {
    return await this.messageModel.find({
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id }
      ]
    }).sort({ timestamp: 1 });
  }

  // Get recent conversations for a user
  async getRecentChats(userId: number): Promise<Message[]> {
    return await this.messageModel.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(10);
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

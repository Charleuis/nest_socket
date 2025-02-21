import { HttpStatus, Injectable } from '@nestjs/common';
import { Chat } from '../entities/chat.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../users/entities/user.entity';
import { Message } from '../entities/message.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { createResponse } from 'src/common/response/response.helper';
import { JwtUserPayload } from 'src/common/interface/jwt-user-payload';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createMessageDto: CreateMessageDto) {
    const { chatId, senderId, content, messageType = 'text' } = createMessageDto;
    
    const [chat, sender] = await Promise.all([
      this.chatModel.findById(chatId),
      this.userModel.findById(senderId)
    ]);

    if (!chat || !sender) {
      throw new Error('Chat or sender not found');
    }

    // Create the message
    const message = await this.messageModel.create({
      chat: chatId,
      sender: senderId,
      content,
      messageType,
      sentAt: new Date(),
      readBy: [senderId] // Initialize with sender having read the message
    });

    // Update the chat's lastMessage
    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });

    return message;
  }

  async createPrivateMessage(receiverId: string, senderId: string, content: string, messageType: 'text' | 'image' | 'video' | 'audio' = 'text') {
    // First, try to find an existing private chat between these users
    const existingChat = await this.chatModel.findOne({
      type: 'private',
      members: { $all: [senderId, receiverId] }
    });

    // If chat exists, use it to create message
    if (existingChat) {
      return this.create({
        chatId: existingChat._id.toString(),
        senderId,
        content,
        messageType
      });
    }

    // If no chat exists, create a new private chat
    const newChat = await this.chatModel.create({
      type: 'private',
      members: [senderId, receiverId],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create and return the message
    return this.create({
      chatId: newChat._id.toString(),
      senderId,
      content,
      messageType
    });
  }

  findAll() {
    return `This action returns all messages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  async update(user: JwtUserPayload, messageId: string, updateMessageDto: UpdateMessageDto) {
    const { content } = updateMessageDto;
    const message = await this.messageModel.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }
    // Check if the user is the sender of the message
    if (message.senderId.toString() == user.id) {
      throw new Error('You are not authorized to update this message');
    }
    message.content = content;
    await message.save();

    return createResponse(HttpStatus.OK, 'Message updated successfully', message);
  }

  async remove(user: JwtUserPayload, messageId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    if (message.senderId.toString() == user.id) {
      throw new Error('You are not authorized to delete this message');
    }
    await message.deleteOne();
    return createResponse(HttpStatus.OK, 'Message deleted successfully', message);
  }
}

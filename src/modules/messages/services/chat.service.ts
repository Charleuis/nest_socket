import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../entities/message.entity';
import { CreateChatDto } from '../dto/create-chat.dto';
import { Chat } from '../entities/chat.entity';
import { createResponse } from 'src/common/response/response.helper';
import { JwtUserPayload } from 'src/common/interface/jwt-user-payload';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<Message>,
    @InjectModel(Chat.name)
    private chatModel: Model<Chat>
  ) {}

//SEND MESSAGE
async sendMessage(createChatDto: CreateChatDto, user: JwtUserPayload) {
  const { receiverId, content, messageType, chatId: providedChatId } = createChatDto;     
  const senderId = user.id;
  
  if (!content) {
    return createResponse(HttpStatus.BAD_REQUEST, 'Message content is required');
  }

  let chat;

  // If chatId is provided, verify it exists and user is a member
  if (providedChatId) {
    if (!Types.ObjectId.isValid(providedChatId)) {
      return createResponse(HttpStatus.BAD_REQUEST, 'Invalid chat ID');
    }

    chat = await this.chatModel.findById(providedChatId);
    if (!chat) {
      return createResponse(HttpStatus.NOT_FOUND, 'Chat not found');
    }

    // Check if sender is a member of the chat
    if (!chat.members.some(member => member.toString() === senderId)) {
      return createResponse(HttpStatus.FORBIDDEN, 'You are not a member of this chat');
    }

    chat = providedChatId;
  } 
  // If no chatId provided, handle private chat creation/finding using receiverId
  else if (receiverId) {
    if (!Types.ObjectId.isValid(receiverId)) {
      return createResponse(HttpStatus.BAD_REQUEST, 'Invalid receiver ID');
    }

    chat = await this.chatModel.findOne({
      type: 'private',
      members: { 
        $all: [
          new Types.ObjectId(senderId), 
          new Types.ObjectId(receiverId)
        ] 
      },
    });

    if (!chat) {
      // Create new private chat
      chat = await this.chatModel.create({
        members: [
          new Types.ObjectId(senderId), 
          new Types.ObjectId(receiverId)
        ],
        type: 'private',
        createdBy: new Types.ObjectId(senderId),
      });
    }
    chat = chat._id;
  } else {
    return createResponse(HttpStatus.BAD_REQUEST, 'Either chatId or receiverId is required');
  }

  try {
    // Create the message
    const message = await this.messageModel.create({
      senderId: new Types.ObjectId(senderId),
      chatId: chat,
      content,
      messageType: messageType || 'text',
    });

    // Update last message in chat
    await this.chatModel.findByIdAndUpdate(chat, { 
      lastMessage: message._id,
      updatedAt: new Date()
    });

    return createResponse(HttpStatus.CREATED, 'Message sent successfully', message);
  } catch (error) {
    return createResponse(
      HttpStatus.INTERNAL_SERVER_ERROR, 
      'Failed to send message',
      error
    );
  }
}

//GET PRIVATE CHAT
  async getPrivateChat(user: JwtUserPayload, chatId?: string) {
    const userId = user.id;
    if (!chatId) {
      const userChats = await this.chatModel.find({
        members: userId
      }).select('_id');

      const messages = await this.messageModel.find({
        chatId: { $in: userChats.map(chat => chat._id) }
      }).sort({ updatedAt: -1 });

      return createResponse(HttpStatus.OK, 'Messages fetched successfully', messages);
    } else {
      const messages = await this.messageModel.find({
        chatId: new Types.ObjectId(chatId)
      }).sort({ updatedAt: -1 });

      if (!messages.length) {
        return createResponse(HttpStatus.NOT_FOUND, 'No messages found', []);
      }

    return createResponse(HttpStatus.OK, 'Messages fetched successfully', messages);
    }
  }

//CREATE GROUP CHAT
  async createGroupChat(createGroupDto: CreateGroupDto, user: JwtUserPayload) {
    const { groupName, groupImage, members, admin: newAdmins } = createGroupDto;
    const senderId = user.id;
    
    const existingGroupChat = await this.chatModel.findOne({
      groupName: groupName,
      createdBy: new Types.ObjectId(senderId),
    });
    if (existingGroupChat) {
      return createResponse(HttpStatus.BAD_REQUEST, 'Group chat already exists with this name');
    }

    // Convert valid members and admins to strings for easier comparison
    let finalMembers = members
      ?.filter(id => id && Types.ObjectId.isValid(id))
      .map(id => id.toString()) || [];

    let finalAdmins = newAdmins
      ?.filter(id => id && Types.ObjectId.isValid(id))
      .map(id => id.toString()) || [];

    // Ensure creator is in both lists
    const senderIdString = senderId.toString();
    if (!finalMembers.includes(senderIdString)) finalMembers.push(senderIdString);
    if (!finalAdmins.includes(senderIdString)) finalAdmins.push(senderIdString);

    // Ensure all admins are also members
    finalAdmins.forEach(adminId => {
      if (!finalMembers.includes(adminId)) {
        finalMembers.push(adminId);
      }
    });

    // Remove admins that are not in members list
    finalAdmins = finalAdmins.filter(adminId => finalMembers.includes(adminId));

    // Convert back to ObjectIds for storage
    const finalMemberIds = finalMembers.map(id => new Types.ObjectId(id));
    const finalAdminIds = finalAdmins.map(id => new Types.ObjectId(id));

    const newGroupChat = await this.chatModel.create({
      type: 'group',
      members: finalMemberIds,
      groupName: groupName,
      groupImage: groupImage,
      createdBy: new Types.ObjectId(senderId),
      admins: finalAdminIds,
    });

    return createResponse(HttpStatus.CREATED, 'Group chat created successfully', newGroupChat);
  }

//GET GROUP CHAT
  async getGroupChat(chatId: string, user: JwtUserPayload) {
    const userId = user.id;
    const groupChat = await this.chatModel.findById(chatId).select('members admins groupName groupImage');
    if (!groupChat) {
      return createResponse(HttpStatus.NOT_FOUND, 'Group chat not found');
    }

    if (!groupChat.members.includes(new Types.ObjectId(userId))) {
      return createResponse(HttpStatus.FORBIDDEN, 'You are not a member of this group');
    }

    const messages = await this.messageModel.find({
      chatId: new Types.ObjectId(chatId)
    }).sort({ updatedAt: -1 });

    return createResponse(HttpStatus.OK, 'Group chat fetched successfully', { groupChat, messages });
  }

//UPDATE GROUP CHAT
  async updateGroupChat(chatId: string, updateGroupDto: UpdateGroupDto, user: JwtUserPayload) {
    const userId = user.id;
    const { groupName, groupImage, members, admins: newAdmins } = updateGroupDto;

    const groupChat = await this.chatModel.findById(chatId);
    if (!groupChat) {
      return createResponse(HttpStatus.NOT_FOUND, 'Group chat not found');
    }

    if (!groupChat.admins.includes(new Types.ObjectId(userId))) {
      return createResponse(HttpStatus.FORBIDDEN, 'You are not an admin of this group');
    }

    // Convert existing members and admins to string for easier comparison
    const existingMembers = groupChat.members.map(id => id.toString());
    const existingAdmins = groupChat.admins.map(id => id.toString());
    const userIdString = userId.toString();

    // Handle members update only if members array is provided
    let finalMembers = existingMembers;
    if (members !== undefined) {
      finalMembers = members
        .filter(id => id && Types.ObjectId.isValid(id))
        .map(id => id.toString());
      
      // Ensure current user stays as member
      if (!finalMembers.includes(userIdString)) {
        finalMembers.push(userIdString);
      }
    }

    // Handle admins update
    let finalAdmins = existingAdmins;
    if (newAdmins !== undefined) {
      finalAdmins = newAdmins
        .filter(id => id && Types.ObjectId.isValid(id))
        .map(id => id.toString());
      
      // Ensure current user stays as admin
      if (!finalAdmins.includes(userIdString)) {
        finalAdmins.push(userIdString);
      }
    }

    // Ensure all admins are also members
    finalAdmins.forEach(adminId => {
      if (!finalMembers.includes(adminId)) {
        finalMembers.push(adminId);
      }
    });

    // Convert back to ObjectIds for storage
    const finalMemberIds = finalMembers.map(id => new Types.ObjectId(id));
    const finalAdminIds = finalAdmins.map(id => new Types.ObjectId(id));

    const updatedGroupChat = await this.chatModel.findByIdAndUpdate(
      chatId,
      {
        groupName: groupName || groupChat.groupName,
        groupImage: groupImage || groupChat.groupImage,
        members: finalMemberIds,
        admins: finalAdminIds,
      },
      { new: true }
    );

    return createResponse(HttpStatus.OK, 'Group chat updated successfully', updatedGroupChat);
  }

//DELETE GROUP CHAT
  async deleteGroupChat(chatId: string, user: JwtUserPayload) {
    const userId = user.id;
    const groupChat = await this.chatModel.findById(chatId);
    if (!groupChat) {
      return createResponse(HttpStatus.NOT_FOUND, 'Group chat not found');
    }

    if (!groupChat.admins.includes(new Types.ObjectId(userId))) {
      return createResponse(HttpStatus.FORBIDDEN, 'You are not an admin of this group');
    }

    await this.chatModel.findByIdAndDelete(chatId);
    return createResponse(HttpStatus.OK, 'Group chat deleted successfully');
  }
}

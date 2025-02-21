import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CreateChatDto } from '../dto/create-chat.dto';
import { ChatService } from '../services/chat.service';
import { JwtUserPayload } from 'src/common/interface/jwt-user-payload';
import { User } from 'src/decorator/user.decorator'; 
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(@Body() createChatDto: CreateChatDto, @User() user: JwtUserPayload) {    
    return this.chatService.sendMessage(createChatDto, user);
  }

  @Get()
  async getPrivateChat(@User() user: JwtUserPayload, @Query('chatId') chatId: string) {
    return this.chatService.getPrivateChat(user, chatId);
  }

  @Post('group')
  async createGroupChat(@Body() createGroupDto: CreateGroupDto, @User() user: JwtUserPayload) {    
    return this.chatService.createGroupChat(createGroupDto, user);
  }

  @Get('group/:chatId')
  async getGroupChat(@Param('chatId') chatId: string, @User() user: JwtUserPayload) {
    return this.chatService.getGroupChat(chatId, user);
  }

  @Patch('group/:chatId')
  async updateGroupChat(@Param('chatId') chatId: string, @Body() updateGroupDto: UpdateGroupDto, @User() user: JwtUserPayload) {
    return this.chatService.updateGroupChat(chatId, updateGroupDto, user);
  }

  @Delete('group/:chatId')
  async deleteGroupChat(@Param('chatId') chatId: string, @User() user: JwtUserPayload) {
    return this.chatService.deleteGroupChat(chatId, user);
  }

  @Patch('group/:chatId/leave')
  async leaveGroupChat(@Param('chatId') chatId: string, @User() user: JwtUserPayload) {
    return this.chatService.leaveGroupChat(chatId, user);
  }
}

import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CreateChatDto } from '../dto/create-chat.dto';
import { ChatService } from '../services/chat.service';
import { JwtUserPayload } from 'src/common/interface/jwt-user-payload';
import { User } from 'src/decorator/user.decorator'; 

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(@Body() createChatDto: CreateChatDto, @User() user: JwtUserPayload) {    
    return this.chatService.sendMessage(createChatDto, user);
  }

  @Get('/private')
  async getPrivateChat(@User() user: JwtUserPayload, @Query('chatId') chatId: string) {
    return this.chatService.getPrivateChat(user ,chatId);
  }
}

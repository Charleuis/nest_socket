import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CreateChatDto } from '../dto/create-chat.dto';
// import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { ChatService } from '../services/chat.service';

@Controller('chats')
// @UseGuards(JwtAuthGuard) 
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(@Body() createChatDto: CreateChatDto) {
    return this.chatService.sendMessage(createChatDto);
  }

  @Get('/private/:userId')
  async getPrivateChat(@Param('userId') userId: string, @Query('chatId') chatId: string) {
    return this.chatService.getPrivateChat(userId,chatId);
  }
}

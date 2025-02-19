import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
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

  @Get()
  async getUserChats(@Request() req) {
    const userId = req.user.id;
    return this.chatService.getRecentChats(userId);
  }
}

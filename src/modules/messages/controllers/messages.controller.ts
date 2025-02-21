import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { CreateChatDto } from '../dto/create-chat.dto';
import { User } from 'src/decorator/user.decorator';
import { JwtUserPayload } from 'src/common/interface/jwt-user-payload';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // @Post()
  // create(@Body() createMessageDto: CreateMessageDto) {
  //   return this.messagesService.create(createMessageDto);
  // }

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Patch(':messageId')
  update(@User() user: JwtUserPayload, @Param('messageId') messageId: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(user,messageId, updateMessageDto);
  }

  @Delete(':messageId')
  remove(@User() user: JwtUserPayload, @Param('messageId') messageId: string) {
    return this.messagesService.remove(user, messageId);
  }
}

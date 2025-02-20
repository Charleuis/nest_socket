import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['text', 'image', 'audio', 'video'])
  @IsNotEmpty()
  messageType: string;

  @IsString()
  @IsOptional()
  receiverId?: string;

  @IsString()
  @IsOptional()
  groupName?: string;
}

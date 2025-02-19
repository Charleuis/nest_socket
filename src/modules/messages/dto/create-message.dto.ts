import { IsEnum, IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';

export class CreateMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  chatId: string; 

  @IsMongoId()
  @IsNotEmpty()
  senderId: string; 

  @IsString()
  @IsNotEmpty()
  content: string; 

  @IsEnum(['text', 'image', 'video', 'audio'])
  @IsOptional()
  messageType?: 'text' | 'image' | 'video' | 'audio'; 

  @IsOptional()
  @IsMongoId({ each: true })
  readBy?: string[]; 
}

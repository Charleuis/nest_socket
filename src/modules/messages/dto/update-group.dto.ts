import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGroupDto {
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @IsString()
  @IsOptional()
  groupImage: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  members?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  admins?: string[];
}

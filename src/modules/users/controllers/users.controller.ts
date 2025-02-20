import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdatePasswordDto } from '../dto/passwod-update.dto';
import { JwtUserPayload } from 'src/common/interface/jwt-user-payload';
import { User } from 'src/decorator/user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // find users to add to chat list
  @Get()
  findAll(@Query('search') search: string) {
    return this.usersService.findAll(search);
  }

  // get users to add to group chat
  @Get('users')
  getUsersUser(@User() user: JwtUserPayload) {
    return this.usersService.getUsersUser(user);
  }

  @Get()
  findOne(@Query('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch()
  update(@User() user: JwtUserPayload, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Patch('password')
  updatePassword(@User() user: JwtUserPayload, @Body() updatePasswordDto: UpdatePasswordDto) {
    return this.usersService.updatePassword(user.id, updatePasswordDto);
  }

  @Delete()
  remove(@User() user: JwtUserPayload) {
    return this.usersService.remove(user.id);
  }

  //if token is valid
}

import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdatePasswordDto } from '../dto/passwod-update.dto';
import * as bcrypt from 'bcrypt';
import { createResponse } from 'src/common/response/response.helper';
import { JwtUserPayload } from 'src/common/interface/jwt-user-payload';
import { Chat } from 'src/modules/messages/entities/chat.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
  ) {}

  async findAll(search: string) {
    const users = await this.userModel.find({ isDeleted: false, email: { $regex: search, $options: 'i' } });
    return createResponse(HttpStatus.OK, 'Users fetched successfully', users);
  }

  async findOne(id: string) {
    const user = await this.userModel.findOne({ _id: new Types.ObjectId(id), isDeleted: false });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return createResponse(HttpStatus.OK, 'User fetched successfully', user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.name = updateUserDto.name;
    user.profilePicture = updateUserDto.pic;
    await user.save();
    return createResponse(HttpStatus.OK, 'User updated successfully', user);
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    const user = await this.userModel.findOne({ _id: new Types.ObjectId(id), isDeleted: false });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordMatch = await bcrypt.compare(updatePasswordDto.password, user.password);
    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid password');
    }
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return createResponse(HttpStatus.OK, 'Password updated successfully');
  }

  async remove(id: string) {
    const user = await this.userModel.findOne({ _id: new Types.ObjectId(id), isDeleted: false });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isDeleted = true;
    await user.save();
    return createResponse(HttpStatus.OK, 'User deleted successfully');
  }

    async getUsersUser(user: JwtUserPayload) {
      console.log("user", user);
      
    const chats = await this.chatModel.find({ members: { $in: [user.id] }});
    const usersFriends = chats.map((chat) => chat.members.filter((member) => member.toString() !== user.id));
    const users = await this.userModel.find({ _id: { $in: usersFriends } });
    console.log("usersFriends", users);
    
    return createResponse(HttpStatus.OK, 'Users fetched successfully', users);
  }
}

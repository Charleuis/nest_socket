import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdatePasswordDto } from '../dto/passwod-update.dto';
import * as bcrypt from 'bcrypt';
import { createResponse } from 'src/common/response/response.helper';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async findAll() {
    const users = await this.userModel.find({ isDeleted: false });
    return users;
  }

  async findOne(id: string) {
    const user = await this.userModel.findOne({ _id: new Types.ObjectId(id), isDeleted: false });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.name = updateUserDto.name;
    user.profilePicture = updateUserDto.pic;
    await user.save();
    return user;
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
    return 'User deleted successfully';
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

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
    user.pic = updateUserDto.pic;
    await user.save();
    return user;
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

import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LoginUserDto } from '../dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { response } from 'express';
import { generateToken } from '../auth.utils';
import { generateRefreshToken } from '../auth.utils';
import { RefreshToken } from '../entities/refersh-token.entity';
import { RefreshTokenDocument } from '../entities/refersh-token.entity';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { createResponse } from 'src/common/response/response.helper';
import { isEmail } from 'class-validator';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(createUserDto: CreateUserDto) {
    if (!isEmail(createUserDto.email)) {
      throw new BadRequestException('Invalid email');
    }
    const checkUser = await this.userModel.findOne({ email: createUserDto.email, isDeleted: false });
    if (checkUser) {
      throw new BadRequestException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });    

    const token = await generateToken(this.jwtService, user._id.toString());
    const refreshToken = await generateRefreshToken(this.jwtService, user._id as Types.ObjectId, this.refreshTokenModel);
    return createResponse(HttpStatus.CREATED, 'User created successfully', {
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token,
      refreshToken
      });
  }

  async login(loginDto: LoginUserDto) {
    if (!isEmail(loginDto.email)) {
      throw new BadRequestException('Invalid email');
    }
    const user = await this.userModel.findOne({ email: loginDto.email, isDeleted: false });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isPasswordMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid password');
    }
    const token = await generateToken(this.jwtService, user.email.toString());
    const refreshToken = await generateRefreshToken(this.jwtService, user._id as Types.ObjectId, this.refreshTokenModel);
    const { password, ...userWithoutPassword } = user.toObject();
    return createResponse(HttpStatus.OK, 'Login successful', {
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token,
      refreshToken
    });
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    const decoded = await this.refreshTokenModel.findOne({ token: refreshToken });
    if (!decoded) {
      throw new BadRequestException('Invalid refresh token');
    }
    const token = await generateToken(this.jwtService, decoded.userId.toString());
    const newRefreshToken = await generateRefreshToken(this.jwtService, decoded.userId, this.refreshTokenModel);
    return createResponse(HttpStatus.OK, 'Refresh token successful', {
      userToken: token, refreshToken: newRefreshToken });
  }

  async logout(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    const decoded = await this.refreshTokenModel.findOne({ token: refreshToken });
    if (!decoded) {
      throw new BadRequestException('Invalid refresh token');
    }
    await this.refreshTokenModel.deleteOne({ token: refreshToken });
    return createResponse(HttpStatus.OK, 'Logout successful');
  }
}

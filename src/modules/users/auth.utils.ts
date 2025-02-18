import { JwtService } from "@nestjs/jwt";
import { Types, Model } from 'mongoose';
import { RefreshTokenDocument } from "./entities/refersh-token.entity";
import { InternalServerErrorException } from "@nestjs/common";
import { v4 as uuidv4 } from 'uuid';

export async function generateToken(jwtService: JwtService, userId: string) {
    const payload = { id: userId, name: userId };
    const token = await jwtService.signAsync(payload);
    return token;
}

export async function generateRefreshToken(
    jwtService: JwtService,
    userId: Types.ObjectId,
    refreshTokenModel: Model<RefreshTokenDocument>
) {
    try {
        const token = uuidv4();
        
        await refreshTokenModel.create({
            token,
            userId,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isRevoked: false
        });

        return token;
    } catch (error) {
        throw new InternalServerErrorException('Error generating refresh token');
    }
}
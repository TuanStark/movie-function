import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDTO } from './dto';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: AuthDTO) {
    const { email, password, firstName, lastName } = dto;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ForbiddenException('Email already in use');
    }

    // Hash mật khẩu
    const hash = await argon.hash(password);

    // Tạo user
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hash,
          firstName: firstName || '',
          lastName: lastName || '',
          role: "USER"
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('User with email already exists');
      }
    }
  }

  async login(authDto: AuthDTO) {
    // find user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: authDto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    // compare password
    const isPasswordMatch = await argon.verify(user.password, authDto.password);
    if (!isPasswordMatch) {
      throw new ForbiddenException('Incorrect password');
    }

    return await this.signJwtToken(user.id, user.email);
  }

  //now convert to an object, not string
  async signJwtToken(
    userId: number,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: userId,
      email,
    };

    // Generate access token (short-lived)
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1d', // 15 minutes
      secret: this.config.get('JWT_SECRET'),
    });

    // Generate refresh token (long-lived)
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d', // 7 days
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get('JWT_SECRET'),
      });

      // Extract user info from payload
      const userId = payload.sub;
      const email = payload.email;

      // Find the user to ensure they still exist
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.email !== email) {
        throw new ForbiddenException('Access denied');
      }

      // Generate new tokens
      return this.signJwtToken(userId, email);
    } catch (error) {
      throw new ForbiddenException('Invalid refresh token');
    }
  }

//   async loginGoogle(dto: { email: string; name: string; googleId: string }) {
//     const { email, name, googleId } = dto;

//     let user = await this.prisma.user.findFirst({
//       where: {
//         OR: [
//           { email },
//         //   { GoogleId: googleId },
//         ],
//       },
//     });

//     if (!user) {
//       // Tạo user mới nếu chưa tồn tại
//       user = await this.prisma.user.create({
//         data: {
//           email,
//           firstName: name.split(' ')[0],
//           lastName: name.split(' ')[1],
//           password: "",
//         //   GoogleId: googleId,
//           role: "USER"
//         },
//       });
//     } else if (!user.GoogleId) {
//       // Cập nhật googleId nếu user tồn tại qua email nhưng chưa có googleId
//       user = await this.prisma.user.update({
//         where: { id: user.id },
//         data: { GoogleId: googleId }
//       });
//     }


//     return await this.signJwtToken(user.id, user.email);
//   }

//   async loginFacebook(dto: { name: string; facebookId: string }) {
//     const { name, facebookId } = dto;

//     let user = await this.prisma.user.findFirst({
//       where: {
//         OR: [
//           { FacebookId: facebookId },
//         ],
//       },
//     });

//     if (!user) {
//       user = await this.prisma.user.create({
//         data: {
//           email: "",
//           fullName: name,
//           password: "",
//           FacebookId:facebookId,
//           role: {
//             connect: {
//               id: 1,
//             },
//           },
//         },
//       });
//     } else if (!user.FacebookId) {
//       user = await this.prisma.user.update({
//         where: { id: user.id },
//         data: { FacebookId: facebookId },
//       });
//     }

//     return await this.signJwtToken(user.id, user.email);
//   }
}

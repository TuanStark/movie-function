import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Req,
  Delete,
  HttpCode,
  HttpStatus as NestHttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDTO } from './dto';
import { ResponseData } from '../global/globalClass';
import { HttpStatus, HttpMessage } from '../global/globalEnum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createAuthDto: AuthDTO) {
    try {
      const user = await this.authService.register(createAuthDto);
      return new ResponseData(user, HttpStatus.CREATED, HttpMessage.CREATED);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        if (
          error.message.includes('already in use') ||
          error.message.includes('already exists')
        ) {
          return new ResponseData(
            null,
            HttpStatus.CONFLICT,
            HttpMessage.ALREADY_EXISTS,
          );
        }
        return new ResponseData(
          null,
          HttpStatus.FORBIDDEN,
          HttpMessage.ACCESS_DENIED,
        );
      }

      if (error.code === 'P2002') {
        // Prisma unique constraint error
        return new ResponseData(
          null,
          HttpStatus.CONFLICT,
          HttpMessage.ALREADY_EXISTS,
        );
      }

      // Handle validation errors
      if (error.status === 400) {
        return new ResponseData(
          error.response,
          HttpStatus.VALIDATION_ERROR,
          HttpMessage.VALIDATION_ERROR,
        );
      }

      return new ResponseData(
        error,
        HttpStatus.SERVER_ERROR,
        HttpMessage.SERVER_ERROR,
      );
    }
  }
  @Post('login')
  async login(@Body() createAuthDto: AuthDTO) {
    try {
      const result = await this.authService.login(createAuthDto);
      return new ResponseData(result, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        if (error.message.includes('Invalid credentials')) {
          return new ResponseData(
            null,
            HttpStatus.UNAUTHORIZED,
            HttpMessage.INVALID_CREDENTIALS,
          );
        }
        if (error.message.includes('Incorrect password')) {
          return new ResponseData(
            null,
            HttpStatus.UNAUTHORIZED,
            HttpMessage.INVALID_CREDENTIALS,
          );
        }
        return new ResponseData(
          null,
          HttpStatus.FORBIDDEN,
          HttpMessage.ACCESS_DENIED,
        );
      }

      // Handle validation errors
      if (error.status === 400) {
        return new ResponseData(
          error.response,
          HttpStatus.VALIDATION_ERROR,
          HttpMessage.VALIDATION_ERROR,
        );
      }

      return new ResponseData(
        error,
        HttpStatus.SERVER_ERROR,
        HttpMessage.SERVER_ERROR,
      );
    }
  }

  @Post('refresh')
  @HttpCode(NestHttpStatus.OK)
  async refreshTokens(@Body() body: { refreshToken: string }) {
    try {
      const tokens = await this.authService.refreshTokens(body.refreshToken);
      return new ResponseData(tokens, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        if (error.message.includes('Invalid refresh token')) {
          return new ResponseData(
            null,
            HttpStatus.UNAUTHORIZED,
            HttpMessage.REFRESH_TOKEN_INVALID,
          );
        }
        if (error.message.includes('Access denied')) {
          return new ResponseData(
            null,
            HttpStatus.FORBIDDEN,
            HttpMessage.ACCESS_DENIED,
          );
        }
        return new ResponseData(
          null,
          HttpStatus.FORBIDDEN,
          HttpMessage.ACCESS_DENIED,
        );
      }

      return new ResponseData(
        error,
        HttpStatus.SERVER_ERROR,
        HttpMessage.SERVER_ERROR,
      );
    }
  }

  // @Post('google')
  // async loginGoogle(@Body() dto: { email: string; name: string; googleId: string }) {
  //   try {
  //     return new ResponseData(
  //       await this.authService.loginGoogle(dto),
  //       HttpStatus.SUCCESS,
  //       HttpMessage.SUCCESS,
  //     );
  //   } catch (error) {
  //     return new ResponseData(
  //       error,
  //       HttpStatus.SERVER_ERROR,
  //       HttpMessage.SERVER_ERROR,
  //     );
  //   }
  // }

  // @Post('facebook')
  // async loginFacebook(@Body() dto: { email: string; name: string; facebookId: string }) {
  //   try {
  //     return new ResponseData(
  //       await this.authService.loginFacebook(dto),
  //       HttpStatus.SUCCESS,
  //       HttpMessage.SUCCESS,
  //     );
  //   } catch (error) {
  //     return new ResponseData(
  //       error,
  //       HttpStatus.SERVER_ERROR,
  //       HttpMessage.SERVER_ERROR,
  //     );
  //   }
  // }

}

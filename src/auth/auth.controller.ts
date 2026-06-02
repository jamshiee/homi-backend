import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/users.entity';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async sendOtp(@Body() dto: SendOtpDto) {
    const result = await this.authService.sendOtp(dto.phone);
    return { data: result, message: `OTP sent via ${result.channel}` };
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const result = await this.authService.verifyOtp(
      dto.phone,
      dto.otp,
      dto.preferredLanguage,
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined,
      req.ip,
    );
    return {
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
        user: {
          id: result.user.id,
          phone: result.user.phone,
          name: result.user.name,
          preferredLanguage: result.user.preferredLanguage,
          profileMediaId: result.user.profileMediaId,
          profileMediaUrl: result.user.profileMedia?.url ?? null,
          isAdmin: result.isAdmin,
        },
      },
      message: result.isNewUser ? 'Account created' : 'Login successful',
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refreshToken') token: string,
    @Req() req: Request,
  ) {
    const result = await this.authService.refreshTokens(
      token,
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined,
      req.ip,
    );
    return { data: result, message: 'Tokens refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') token: string) {
    await this.authService.logout(token);
    return { data: null, message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: User) {
    const admins = this.config.get<string[]>('admin.numbers') ?? [];
    const isAdmin = admins.includes(user.phone);
    return {
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        preferredLanguage: user.preferredLanguage,
        profileMediaId: user.profileMediaId,
        isAdmin,
      },
      message: 'Profile fetched',
    };
  }
}

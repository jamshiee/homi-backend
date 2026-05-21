import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OtpService, OtpDeliveryChannel } from './otp.service';
import {
  OtpVerification,
  OtpStatus,
  OtpChannel,
} from './entities/otp-verification.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/users.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(OtpVerification)
    private readonly otpRepo: Repository<OtpVerification>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sendOtp(phone: string) {
    await this.checkRateLimit(phone);
    const otp = this.otpService.generate();
    const otpHash = await this.otpService.hash(otp);
    const expiresAt = new Date(
      Date.now() + this.config.get<number>('otp.expirySeconds')! * 1000,
    );

    await this.otpRepo.update(
      { phone, status: OtpStatus.PENDING },
      { status: OtpStatus.EXPIRED },
    );

    const channel = await this.otpService.send(phone, otp);
    await this.otpRepo.save({
      phone,
      otpHash,
      expiresAt,
      channel:
        channel === OtpDeliveryChannel.WHATSAPP
          ? OtpChannel.WHATSAPP
          : OtpChannel.SMS,
      status: OtpStatus.PENDING,
    });

    return {
      channel,
      expiresIn: this.config.get<number>('otp.expirySeconds')!,
    };
  }

  async verifyOtp(
    phone: string,
    code: string,
    preferredLanguage?: string,
    deviceInfo?: string,
    ip?: string,
  ) {
    const record = await this.otpRepo.findOne({
      where: { phone, status: OtpStatus.PENDING },
      order: { createdAt: 'DESC' },
    });

    if (!record)
      throw new BadRequestException('No pending OTP. Request a new one.');
    if (new Date() > record.expiresAt) {
      await this.otpRepo.update(record.id, { status: OtpStatus.EXPIRED });
      throw new BadRequestException('OTP expired. Request a new one.');
    }

    const max = this.config.get<number>('otp.maxAttempts')!;
    if (record.attemptCount >= max) {
      await this.otpRepo.update(record.id, { status: OtpStatus.FAILED });
      throw new HttpException(
        'Too many attempts. Request a new OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!(await this.otpService.verify(code, record.otpHash))) {
      await this.otpRepo.increment({ id: record.id }, 'attemptCount', 1);
      throw new BadRequestException(
        `Invalid OTP. ${max - (record.attemptCount + 1)} attempt(s) remaining.`,
      );
    }

    await this.otpRepo.update(record.id, {
      status: OtpStatus.VERIFIED,
      verifiedAt: new Date(),
    });

    const { user, isNew } = await this.usersService.findOrCreate(phone, preferredLanguage);
    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user, deviceInfo, ip);
    const admins = this.config.get<string[]>('admin.numbers') ?? [];
    const isAdmin = admins.includes(phone);

    return { ...tokens, user, isNewUser: isNew, isAdmin };
  }

  async refreshTokens(rawToken: string, deviceInfo?: string, ip?: string) {
    const record = await this.refreshRepo.findOne({
      where: { tokenHash: this.hashToken(rawToken) },
      relations: ['user'],
    });
    if (!record || record.isRevoked || new Date() > record.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
    await this.refreshRepo.update(record.id, { isRevoked: true });
    return this.issueTokens(record.user, deviceInfo, ip);
  }

  async logout(rawToken: string): Promise<void> {
    await this.refreshRepo.update(
      { tokenHash: this.hashToken(rawToken) },
      { isRevoked: true },
    );
  }

  private async issueTokens(user: User, deviceInfo?: string, ip?: string) {
    const payload = { sub: user.id, phone: user.phone };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessExpires') || '15m',
    } as any);
    const rawRefresh = crypto.randomUUID();
    const expiresAt = this.computeRefreshExpiry();
    await this.refreshRepo.save({
      userId: user.id,
      tokenHash: this.hashToken(rawRefresh),
      deviceInfo,
      ipAddress: ip,
      expiresAt,
    });
    return { accessToken, refreshToken: rawRefresh };
  }

  private computeRefreshExpiry(): Date {
    const raw = this.config.get<string>('jwt.refreshExpires') || '30d';
    const d = new Date();
    const m = /^(\d+)d$/i.exec(raw);
    if (m) d.setDate(d.getDate() + parseInt(m[1], 10));
    else d.setDate(d.getDate() + 30);
    return d;
  }

  private hashToken(t: string) {
    return crypto.createHash('sha256').update(t).digest('hex');
  }

  private async checkRateLimit(phone: string) {
    const count = await this.otpRepo.count({
      where: { phone, createdAt: MoreThan(new Date(Date.now() - 60_000)) },
    });
    if (count >= 3)
      throw new HttpException(
        'Too many OTP requests. Wait 60 seconds.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOtps() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.otpRepo
      .createQueryBuilder()
      .delete()
      .from(OtpVerification)
      .where('status IN (:...statuses)', {
        statuses: [OtpStatus.VERIFIED, OtpStatus.EXPIRED, OtpStatus.FAILED],
      })
      .andWhere('created_at < :cutoff', { cutoff })
      .execute();
    this.logger.log('OTP cleanup complete');
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/users.entity';

export enum OtpChannel {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
}

export enum OtpStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

@Entity('otp_verification')
export class OtpVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'phone', length: 20 })
  phone: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'otp_hash', length: 100 })
  otpHash: string;

  @Column({
    name: 'channel',
    type: 'enum',
    enum: OtpChannel,
    default: OtpChannel.WHATSAPP,
  })
  channel: OtpChannel;

  @Column({
    name: 'status',
    type: 'enum',
    enum: OtpStatus,
    default: OtpStatus.PENDING,
  })
  status: OtpStatus;

  @Column({ name: 'attempt_count', default: 0 })
  attemptCount: number;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'verified_at', nullable: true, type: 'timestamp' })
  verifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

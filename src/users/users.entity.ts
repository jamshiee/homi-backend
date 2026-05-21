import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Media } from '../media/entities/media.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'phone', unique: true, length: 20 })
  phone: string;

  @Column({ name: 'name', nullable: true, length: 100 })
  name: string;

  @Column({ name: 'profile_media_id', nullable: true })
  profileMediaId: string;

  @ManyToOne(() => Media, { nullable: true, eager: false })
  @JoinColumn({ name: 'profile_media_id' })
  profileMedia: Media;

  @Column({ name: 'preferred_language', default: 'en', length: 5 })
  preferredLanguage: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamp' })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

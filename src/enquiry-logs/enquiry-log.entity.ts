import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/users.entity';

export enum EnquiryType {
  WHATSAPP = 'whatsapp',
  PHONE_REVEAL = 'phone_reveal',
  VIEW = 'view',
}

@Entity('enquiry_log')
export class EnquiryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'enquiry_type', type: 'enum', enum: EnquiryType })
  enquiryType: EnquiryType;

  @Column({ name: 'ip_address', nullable: true, length: 50 })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true, length: 255 })
  userAgent: string;

  @ManyToOne(() => Property, (p) => p.enquiryLogs, { eager: false })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

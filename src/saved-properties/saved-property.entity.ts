import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Property } from '../properties/entities/property.entity';

@Entity('saved_property')
@Unique(['userId', 'propertyId'])
export class SavedProperty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Property, (p) => p.savedBy, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

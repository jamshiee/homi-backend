import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { Media } from './media.entity';

@Entity('property_media')
export class PropertyMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @Column({ name: 'media_id' })
  mediaId: string;

  @ManyToOne(() => Property, (p) => p.propertyMedia, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => Media, { eager: false })
  @JoinColumn({ name: 'media_id' })
  media: Media;

  @Column({ name: 'is_cover', default: false })
  isCover: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

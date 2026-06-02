import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { Amenity } from './amenity.entity';

@Entity('property_amenity')
@Unique(['propertyId', 'amenityId'])
export class PropertyAmenity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @Column({ name: 'amenity_id' })
  amenityId: string;

  @ManyToOne(() => Property, (p) => p.propertyAmenities, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => Amenity, (a) => a.propertyAmenities, { eager: false })
  @JoinColumn({ name: 'amenity_id' })
  amenity: Amenity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updateAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PropertyAmenity } from './property-amenity.entity';

@Entity('amenity')
export class Amenity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name_en', length: 100 })
  nameEn: string;

  @Column({ name: 'name_ml', length: 100 })
  nameMl: string;

  @Column({ name: 'icon_name', length: 100 })
  iconName: string;

  @Column({ name: 'is_land', default: false })
  isLand: boolean;

  @Column({ name: 'is_house', default: false })
  isHouse: boolean;

  @Column({ name: 'is_building', default: false })
  isBuilding: boolean;

  @Column({ name: 'is_hotel', default: false })
  isHotel: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PropertyAmenity, (pa) => pa.amenity)
  propertyAmenities: PropertyAmenity[];
}

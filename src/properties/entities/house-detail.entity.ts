import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from './property.entity';

export enum FurnishingStatusEnum{
  FULLY_FURNISHED='fully_furnished',
  SEMI_FURNISHED='semi_furnished',
  UN_FURNISHED='un_furnished'
}

@Entity('house_detail')
export class HouseDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @OneToOne(() => Property, (p) => p.houseDetail, { eager: false })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'bedrooms', default: 0 })
  bedrooms: number;

  @Column({ name: 'bathrooms', default: 0 })
  bathrooms: number;

  @Column({ name: 'balconies', default: 0 })
  balconies: number;

  @Column({ name: 'floors', default: 1 })
  floors: number;

  @Column({ name: 'has_kitchen', default: false })
  hasKitchen: boolean;


  // @Column({ name: 'house_type', type: 'varchar', length: 32, default: 'independent' })
  // houseType: string;

  @Column({
    name: 'furnishing_status',
    type: 'enum',
    enum:FurnishingStatusEnum,
  })
  furnishingStatus: FurnishingStatusEnum;


  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

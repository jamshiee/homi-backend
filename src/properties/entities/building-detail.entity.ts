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

export enum BuildingSubTypeEnum {
  APARTMENT = 'apartment',
  OFFICE = 'office',
  SHOP = 'shop',
  ROOM = 'room',
  WAREHOUSE = 'warehouse',
}

@Entity('building_detail')
export class BuildingDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @OneToOne(() => Property, (p) => p.buildingDetail, { eager: false })
  @JoinColumn({ name: 'property_id' })
  property: Property;

    @Column({ name: 'sub_type', type: 'enum', enum: BuildingSubTypeEnum })
    subType: BuildingSubTypeEnum;

  @Column({ name: 'total_area', type: 'decimal', precision: 10, scale: 2 })
  totalArea: string;

  @Column({ name: 'area_unit', length: 20, default: 'sqft' })
  areaUnit: string;

  @Column({ name: 'floor_number', default: 0 })
  floorNumber: number;

  @Column({
    name: 'current_status',
    type: 'varchar',
    length: 32,
    default: 'vacant',
  })
  currentStatus: string;


  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

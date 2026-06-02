import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Property } from './property.entity';

export enum BuildingSubTypeEnum {
  OFFICE = 'office',
  ROOM = 'room',
  WAREHOUSE = 'warehouse',
}

export enum BuildingStatusEnum{
    READY_TO_MOVE = "ready_to_move",
    UNDER_CONSTRUCTION = "under_construction",
}

export enum AreaUnitEnum {
    SQFT = 'sqft',
    CENT = 'cent',
    ACRE = 'acre',
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

  @Column({ name: 'area_unit',  enum: AreaUnitEnum })
  areaUnit: AreaUnitEnum;

  @Column({ name: 'floor_number', default: 0 })
  floorNumber: number;

  @Column({
    name: 'current_status',
    type: 'enum',
    enum: BuildingStatusEnum,
  })
  currentStatus: BuildingStatusEnum;


  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updateAt: Date;
  
    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date | null;
}

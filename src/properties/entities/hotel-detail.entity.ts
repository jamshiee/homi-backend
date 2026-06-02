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

export enum HotelSubTypeEnum {
  HOTEL = "hotel",
  PG = "pg",
  LODGE = "lodge",
  RESORT = "resort"
}

export enum RoomTypeEnum {
  SINGLE = "single",
  DOUBLE = "double",
  FAMILY = "family"
}


@Entity('hotel_detail')
export class HotelDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @OneToOne(() => Property, (p) => p.hotelDetail, { eager: false })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'sub_type', type: 'enum', enum: HotelSubTypeEnum })
  subType: HotelSubTypeEnum;


  @Column({
    name: 'room_type',
    type: 'enum',
    enum: RoomTypeEnum,
    default: RoomTypeEnum.SINGLE
  })
  roomType: RoomTypeEnum;

  @Column({
    name: 'occupancy',
    type: 'int',
  })
  occupancy: number;

  @Column({ name: 'meals_included', default: false })
  mealsIncluded: boolean;

  

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updateAt: Date;
  
    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date | null;
}

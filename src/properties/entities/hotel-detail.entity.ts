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

export enum HotelSubTypeEnum{
  HOTEL="hotel",
  PG="pg",
  LODGE="lodge",
}

export enum RoomTypeEnum{
  SINGLE="single",
  DOUBLE="double",
  FAMILY="family"
}

export enum OccupancyTypeEnum{
  SINGLE="single",
  DOUBLE="double",
  FAMILY="family"
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

  @Column({ name: 'rooms_available', default: 1 })
  roomsAvailable: number;

  @Column({
     name: 'room_type',
      type: 'enum',
       enum:RoomTypeEnum,
        default: RoomTypeEnum.SINGLE })
  roomType: RoomTypeEnum;

  @Column({
     name: 'occupancy',
      type: 'enum',
       enum:OccupancyTypeEnum,
        default: OccupancyTypeEnum.SINGLE })
  occupancy: OccupancyTypeEnum;

  @Column({ name: 'meals_included', default: false })
  mealsIncluded: boolean;

  @Column({ name: 'price_per_night', type: 'bigint', nullable: true })
  pricePerNight: string;

  @Column({ name: 'price_per_month', type: 'bigint', nullable: true })
  pricePerMonth: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/users.entity';
import { LandDetail } from './land-detail.entity';
import { HouseDetail } from './house-detail.entity';
import { BuildingDetail } from './building-detail.entity';
import { HotelDetail } from './hotel-detail.entity';
import { PropertyAmenity } from '../../amenities/property-amenity.entity';
import { PropertyMedia } from '../../media/entities/property-media.entity';
import { SavedProperty } from '../../saved-properties/saved-property.entity';
import { EnquiryLog } from '../../enquiry-logs/enquiry-log.entity';

export enum PropertyType {
  LAND = 'land',
  HOUSE = 'house',
  BUILDING = 'building',
  HOTEL = 'hotel',
}

export enum TransactionType {
  ALL = 'all',
  BUY = 'buy',
  RENT = 'rent',
  LEASE = 'lease',
}

export enum PropertyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PriceUnit {
  TOTAL = 'total',
  PER_CENT = 'per_cent',
  PER_ACRE = 'per_acre',
  PER_SQFT = 'per_sqft',
  PER_SQM = 'per_sqm',
  PER_NIGHT = 'per_night',
  PER_MONTH = 'per_month',
}

// The details stored here are:
// Lister, Location, Price, Property Type, Transaction Type, Description, Status, Featured
@Entity('property')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'title', length: 255, nullable: true })
  title: string;

  @Column({ name: 'slug', unique: true, nullable: true })
  slug: string;

  @Column({ name: 'listed_by_user_id', type: 'uuid' })
  listedByUserId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'listed_by_user_id' })
  lister: User;

  @Column({ name: 'type', type: 'enum', enum: PropertyType })
  type: PropertyType;

  @Column({ name: 'transaction_type', type: 'enum', enum: TransactionType })
  transactionType: TransactionType;

  @Column({ name: 'district', length: 100 })
  district: string;

  @Column({ name: 'locality', length: 150 })
  locality: string;

  @Column({ name: 'address', nullable: true, type: 'text' })
  address: string;

  @Column({
    name: 'latitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude: number;

  @Column({
    name: 'longitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude: number;

  @Column({ name: 'price', type: 'bigint' })
  price: number;

  @Column({ name: 'is_negotiable', default: false })
  isNegotiable: boolean;

  @Column({ name: 'advance_amount', nullable: true, type: 'bigint' })
  advanceAmount: number;

  @Column({ name: 'price_unit', nullable: true, type: 'enum', enum: PriceUnit })
  priceUnit: PriceUnit;

  @Column({ name: 'description', nullable: true, type: 'text' })
  description: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PropertyStatus,
    default: PropertyStatus.ACTIVE,
  })
  status: PropertyStatus;

  @Column({
    name: 'moderation_status',
    type: 'enum',
    enum: ModerationStatus,
    default: ModerationStatus.APPROVED,
  })
  moderationStatus: ModerationStatus;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'featured_until', nullable: true, type: 'timestamp' })
  featuredUntil: Date;

  @Column({ name: 'featured_order', default: 0 })
  featuredOrder: number;

  @Column({ name: 'contact_phone', length: 20 })
  contactPhone: string;

  @Column({ name: 'alternate_phone', nullable: true, length: 20 })
  alternatePhone: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'whatsapp_tap_count', default: 0 })
  whatsappTapCount: number;

  @Column({ name: 'phone_reveal_count', default: 0 })
  phoneRevealCount: number;

  @Column({ name: 'published_at', nullable: true, type: 'timestamp' })
  publishedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToOne(() => LandDetail, (d) => d.property, {
    cascade: true,
    eager: false,
  })
  landDetail: LandDetail;

  @OneToOne(() => HouseDetail, (d) => d.property, {
    cascade: true,
    eager: false,
  })
  houseDetail: HouseDetail;

  @OneToOne(() => BuildingDetail, (d) => d.property, {
    cascade: true,
    eager: false,
  })
  buildingDetail: BuildingDetail;

  @OneToOne(() => HotelDetail, (d) => d.property, {
    cascade: true,
    eager: false,
  })
  hotelDetail: HotelDetail;

  @OneToMany(() => PropertyAmenity, (pa) => pa.property, { cascade: true })
  propertyAmenities: PropertyAmenity[];

  @OneToMany(() => PropertyMedia, (pm) => pm.property)
  propertyMedia: PropertyMedia[];

  @OneToMany(() => SavedProperty, (sp) => sp.property)
  savedBy: SavedProperty[];

  @OneToMany(() => EnquiryLog, (l) => l.property)
  enquiryLogs: EnquiryLog[];

}

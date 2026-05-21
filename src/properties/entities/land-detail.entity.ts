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

@Entity('land_detail')
export class LandDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @OneToOne(() => Property, (p) => p.landDetail, { eager: false })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'total_area', type: 'decimal', precision: 10, scale: 3 })
  totalArea: string;

  @Column({ name: 'area_unit', length: 20, default: 'cents' })
  areaUnit: string;



  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum MediaEntityType {
  PROPERTY = 'property',
  USER = 'user',
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', type: 'enum', enum: MediaEntityType })
  entityType: MediaEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'url', type: 'text' })
  url: string;

  @Column({ name: 'mime_type', nullable: true, length: 50 })
  mimeType: string;

  @Column({ name: 'file_size_bytes', nullable: true })
  fileSizeBytes: number;

  @Column({ name: 'original_filename', nullable: true, length: 255 })
  originalFilename: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import sharp from 'sharp';
import { Media, MediaEntityType } from './entities/media.entity';
import { PropertyMedia } from './entities/property-media.entity';
import { Property } from '../properties/entities/property.entity';
import { Inject } from '@nestjs/common';
import * as storageProviderInterface from './providers/storage.provider.interface';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media) private readonly mediaRepo: Repository<Media>,
    @InjectRepository(PropertyMedia)
    private readonly pmRepo: Repository<PropertyMedia>,
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @Inject(storageProviderInterface.STORAGE_PROVIDER)
    private readonly storageProvider: storageProviderInterface.IStorageProvider,
  ) {}

  async uploadPropertyPhoto(
    file: Express.Multer.File,
    propertyId: string,
    userId: string,
    isCover: boolean,
    sortOrder: number,
  ): Promise<PropertyMedia> {
    await this.assertPropertyOwner(propertyId, userId);

    if (isCover) {
      await this.pmRepo.update({ propertyId }, { isCover: false });
    }

    const media = await this.saveMedia(
      file,
      MediaEntityType.PROPERTY,
      propertyId,
    );
    return this.pmRepo.save({
      propertyId,
      mediaId: media.id,
      isCover,
      sortOrder,
    });
  }

  async uploadUserPhoto(
    file: Express.Multer.File,
    userId: string,
  ): Promise<Media> {
    return this.saveMedia(file, MediaEntityType.USER, userId);
  }

  async getPropertyMedia(propertyId: string): Promise<PropertyMedia[]> {
    return this.pmRepo.find({
      where: { propertyId },
      relations: ['media'],
      order: { isCover: 'DESC', sortOrder: 'ASC' },
    });
  }

  async deletePropertyMedia(id: string, userId: string): Promise<void> {
    const pm = await this.pmRepo.findOne({
      where: { id },
      relations: ['media'],
    });
    if (!pm) return;

    await this.assertPropertyOwner(pm.propertyId, userId);
    await this.pmRepo.delete(id);
    await this.mediaRepo.softDelete(pm.mediaId);
  }

  private async assertPropertyOwner(
    propertyId: string,
    userId: string,
  ): Promise<void> {
    const property = await this.propertyRepo.findOne({
      where: { id: propertyId },
      select: ['id', 'listedByUserId'],
    });

    if (!property) throw new NotFoundException('Property not found.');
    if (property.listedByUserId !== userId) {
      throw new ForbiddenException(
        'Only listing owner can modify this property media.',
      );
    }
  }

  private async saveMedia(
    file: Express.Multer.File,
    entityType: MediaEntityType,
    entityId: string,
  ): Promise<Media> {
    let buffer = file.buffer;
    let mimeType = file.mimetype;
    let filename = file.originalname;

    if (file.mimetype.startsWith('image/') && !file.mimetype.includes('gif')) {
      try {
        const pipeline = sharp(file.buffer)
          .resize({
            width: 1200,
            height: 1200,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 80, effort: 4 }); // Convert to WebP

        buffer = await pipeline.toBuffer();
        mimeType = 'image/webp';

        const ext = path.extname(file.originalname);
        const nameWithoutExt = file.originalname.slice(
          0,
          -ext.length || file.originalname.length,
        );
        filename = `${nameWithoutExt}.webp`;
      } catch (err) {
        // Fallback to original
      }
    }

    const url = await this.storageProvider.uploadFile(buffer, filename, mimeType);
    return this.mediaRepo.save({
      entityType,
      entityId,
      url,
      mimeType,
      fileSizeBytes: buffer.length,
      originalFilename: file.originalname,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { Media, MediaEntityType } from './entities/media.entity';
import { PropertyMedia } from './entities/property-media.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media) private readonly mediaRepo: Repository<Media>,
    @InjectRepository(PropertyMedia) private readonly pmRepo: Repository<PropertyMedia>,
    private readonly config: ConfigService,
  ) {}

  async uploadPropertyPhoto(
    file: Express.Multer.File,
    propertyId: string,
    isCover: boolean,
    sortOrder: number,
  ): Promise<PropertyMedia> {
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

  async deletePropertyMedia(id: string): Promise<void> {
    const pm = await this.pmRepo.findOne({
      where: { id },
      relations: ['media'],
    });
    if (!pm) return;
    await this.pmRepo.delete(id);
    await this.mediaRepo.softDelete(pm.mediaId);
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
          .jpeg({ quality: 80, progressive: true });

        buffer = await pipeline.toBuffer();
        mimeType = 'image/jpeg';
        
        const ext = path.extname(file.originalname);
        const nameWithoutExt = file.originalname.slice(0, -ext.length || file.originalname.length);
        filename = `${nameWithoutExt}.jpg`;
      } catch (err) {
        // Fallback to original
      }
    }

    const url = await this.saveLocally(buffer, filename);
    return this.mediaRepo.save({
      entityType,
      entityId,
      url,
      mimeType,
      fileSizeBytes: buffer.length,
      originalFilename: file.originalname,
    });
  }

  private async saveLocally(buffer: Buffer, originalFilename: string): Promise<string> {
    const dir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${Date.now()}-${originalFilename.replace(/\s/g, '_')}`;
    fs.writeFileSync(path.join(dir, filename), buffer);
    return `${this.config.get<string>('storage.baseUrl')}/${filename}`;
  }
}

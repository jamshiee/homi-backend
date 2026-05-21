import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedProperty } from './saved-property.entity';

@Injectable()
export class SavedPropertiesService {
  constructor(
    @InjectRepository(SavedProperty)
    private readonly repo: Repository<SavedProperty>,
  ) {}

  async toggle(
    userId: string,
    propertyId: string,
  ): Promise<{ saved: boolean }> {
    const existing = await this.repo.findOne({ where: { userId, propertyId } });
    if (existing) {
      await this.repo.delete(existing.id);
      return { saved: false };
    }
    await this.repo.save({ userId, propertyId });
    return { saved: true };
  }

  async findByUser(userId: string) {
    return this.repo.find({
      where: { userId },
      relations: [
        'property',
        'property.propertyMedia',
        'property.propertyMedia.media',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async isSaved(userId: string, propertyId: string): Promise<boolean> {
    return (await this.repo.count({ where: { userId, propertyId } })) > 0;
  }
}

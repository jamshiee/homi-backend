import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedProperty } from './saved-property.entity';
import { Property } from 'src/properties/entities/property.entity';

@Injectable()
export class SavedPropertiesService {
  constructor(
    @InjectRepository(SavedProperty)
    private readonly repo: Repository<SavedProperty>,
    @InjectRepository(Property)
    private readonly propRepo: Repository<Property>,
  ) { }

  async toggle(
    userId: string,
    propertyId: string,
  ): Promise<{ saved: boolean }> {


    const property = await this.propRepo.findOne({ where: { id: propertyId } });
    if (!property) {
      throw new BadRequestException('Property not found');
    }

    const existing = await this.repo.findOne({ where: { userId, propertyId } });
    if (existing) {
      await this.repo.delete(existing.id);
      return { saved: false };
    }
    await this.repo.save({ userId, propertyId });
    return { saved: true };
  }

  async findByUser(userId: string) {
    const savedProperty = await this.repo.find({
      where: { userId },
      relations: [
        'property',
        'property.lister',
        'property.landDetail',
        'property.houseDetail',
        'property.buildingDetail',
        'property.hotelDetail',
        'property.propertyAmenities',
        'property.propertyAmenities.amenity',
        'property.propertyMedia',
        'property.propertyMedia.media',
      ],
      order: { createdAt: 'DESC' },
    });

    if (!savedProperty) {
      return [];
    }

    const mappedData = savedProperty.map((saved) => {
      return saved.property;
    });

    return mappedData;
  }

  async isSaved(userId: string, propertyId: string): Promise<boolean> {
    return (await this.repo.count({ where: { userId, propertyId } })) > 0;
  }
}

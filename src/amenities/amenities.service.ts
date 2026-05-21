import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenity } from './amenity.entity';

@Injectable()
export class AmenitiesService {
  constructor(
    @InjectRepository(Amenity) private readonly repo: Repository<Amenity>,
  ) {}

  async findAll(module?: string) {
    const qb = this.repo.createQueryBuilder('a').where('a.isActive = :act', {
      act: true,
    });
    if (module === 'land') qb.andWhere('a.isLand = :v', { v: true });
    if (module === 'house') qb.andWhere('a.isHouse = :v', { v: true });
    if (module === 'building') qb.andWhere('a.isBuilding = :v', { v: true });
    if (module === 'hotel') qb.andWhere('a.isHotel = :v', { v: true });
    return qb.orderBy('a.sortOrder', 'ASC').getMany();
  }
}

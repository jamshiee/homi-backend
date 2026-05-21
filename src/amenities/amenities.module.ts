import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenity } from './amenity.entity';
import { PropertyAmenity } from './property-amenity.entity';
import { AmenitiesService } from './amenities.service';
import { AmenitiesController } from './amenities.controller';
import { AMENITIES_SEED } from './amenities.seed';

@Module({
  imports: [TypeOrmModule.forFeature([Amenity, PropertyAmenity])],
  providers: [AmenitiesService],
  controllers: [AmenitiesController],
  exports: [AmenitiesService],
})
export class AmenitiesModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(AmenitiesModule.name);

  constructor(
    @InjectRepository(Amenity) private readonly repo: Repository<Amenity>,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.repo.count()) > 0) return;
    await this.repo.save([...AMENITIES_SEED]);
    this.logger.log('Amenities seeded');
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { LandDetail } from './entities/land-detail.entity';
import { HouseDetail } from './entities/house-detail.entity';
import { BuildingDetail } from './entities/building-detail.entity';
import { HotelDetail } from './entities/hotel-detail.entity';
import { EnquiryLog } from '../enquiry-logs/enquiry-log.entity';
import { SavedProperty } from '../saved-properties/saved-property.entity';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      LandDetail,
      HouseDetail,
      BuildingDetail,
      HotelDetail,
      EnquiryLog,
      SavedProperty,
    ]),
  ],
  providers: [PropertiesService],
  controllers: [PropertiesController],
  exports: [PropertiesService],
})
export class PropertiesModule {}

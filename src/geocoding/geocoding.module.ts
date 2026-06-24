import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeocodingService } from './geocoding.service';
import { GeocodingController } from './geocoding.controller';
import { NominatimProvider } from './providers/nominatim.provider';
import { MapboxProvider } from './providers/mapbox.provider';

@Module({
  imports: [ConfigModule],
  providers: [NominatimProvider, MapboxProvider, GeocodingService],
  controllers: [GeocodingController],
  exports: [GeocodingService],
})
export class GeocodingModule {}

import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Public()
  @Get('search')
  async search(@Query('query') query: string) {
    if (!query) {
      throw new BadRequestException('Query parameter is required');
    }
    const data = await this.geocodingService.search(query);
    return {
      data,
      message: 'Geocoding search results fetched successfully',
    };
  }

  @Public()
  @Get('reverse')
  async reverse(
    @Query('lat') latStr: string,
    @Query('lon') lonStr: string,
  ) {
    if (!latStr || !lonStr) {
      throw new BadRequestException('lat and lon parameters are required');
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      throw new BadRequestException('lat and lon must be valid numbers');
    }

    const data = await this.geocodingService.reverse(lat, lon);
    return {
      data,
      message: 'Reverse geocoding result fetched successfully',
    };
  }
}

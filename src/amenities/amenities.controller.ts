import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AmenitiesService } from './amenities.service';

@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly svc: AmenitiesService) {}

  @Public()
  @Get()
  async list(@Query('module') module?: string) {
    return {
      data: await this.svc.findAll(module),
      message: 'Amenities',
    };
  }
}

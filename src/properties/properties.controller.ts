import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/users.entity';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { EnquiryType } from '../enquiry-logs/enquiry-log.entity';
import { PropertyStatus } from './entities/property.entity';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly svc: PropertiesService) {}

  @Public()
  @Get()
  getFeed(@Query() filters: FilterPropertyDto) {
    return this.svc.findFeed(filters);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyListings(
    @CurrentUser() user: User,
    @Query() filters: FilterPropertyDto,
  ) {
    return this.svc.findByUser(user.id, filters);
  }

  @Public()
  @Get('locations/districts')
  async getLocationsDistricts() {
    return {
      data: await this.svc.getDistinctDistricts(),
      message: 'Active districts fetched',
    };
  }

  @Public()
  @Get('featured')
  async getFeatured() {
    return {
      data: await this.svc.findFeatured(),
      message: 'Featured properties',
    };
  }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string) {
    return { data: await this.svc.findById(id), message: 'Property fetched' };
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreatePropertyDto, @CurrentUser() user: User) {
    return {
      data: await this.svc.create(dto, user.id),
      message: 'Property created',
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser() user: User,
  ) {
    return {
      data: await this.svc.update(id, dto, user.id),
      message: 'Property updated',
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async setStatus(
    @Param('id') id: string,
    @Body('status') status: PropertyStatus,
  ) {
    return {
      data: await this.svc.setStatus(id, status),
      message: 'Status updated',
    };
  }

  @Patch(':id/feature')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async setFeatured(
    @Param('id') id: string,
    @Body()
    body: {
      isFeatured: boolean;
      featuredOrder: number;
      featuredUntil?: string;
    },
  ) {
    return {
      data: await this.svc.setFeatured(
        id,
        body.isFeatured,
        body.featuredOrder,
        body.featuredUntil ? new Date(body.featuredUntil) : undefined,
      ),
      message: 'Featured updated',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.svc.remove(id, user.id);
    return { data: null, message: 'Property deleted' };
  }

  @Public()
  @Post(':id/enquiry')
  @HttpCode(HttpStatus.OK)
  async logEnquiry(
    @Param('id') id: string,
    @Body('enquiryType') type: EnquiryType,
    @CurrentUser() user: User | undefined,
    @Req() req: Request,
  ) {
    await this.svc.logEnquiry(
      id,
      type,
      user?.id,
      req.ip,
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined,
    );
    return { data: null, message: 'Logged' };
  }

  @Public()
  @Get(':id/related')
  async getRelated(@Param('id') id: string) {
    return {
      data: await this.svc.findRelated(id),
      message: 'Related properties',
    };
  }
}

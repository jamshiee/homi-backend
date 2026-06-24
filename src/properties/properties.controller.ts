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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
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

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  getFeed(
    @Query() filters: FilterPropertyDto,
    @CurrentUser() user: User | null,
  ) {
    return this.svc.findFeed(filters, user?.id ?? null);
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
  @Get('locations/localities')
  async getLocationsLocalities(@Query('district') district?: string) {
    return {
      data: await this.svc.getDistinctLocalities(district),
      message: 'Active localities fetched',
    };
  }

  // ==========================================
  // ADMIN FEATURED PROPERTIES MODULE ENDPOINTS
  // ==========================================

  @Get('admin/featured')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAdminFeatured() {
    return {
      data: await this.svc.findAdminFeatured(),
      message: 'All featured properties fetched for admin',
    };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAdminAllProperties(@Query() filters: FilterPropertyDto) {
    return this.svc.findAdminAll(filters);
  }

  // ==========================================
  // PUBLIC & USER ENDPOINTS
  // ==========================================

  @UseGuards(OptionalJwtAuthGuard)
  @Get('featured')
  async getFeatured(@CurrentUser() user: User | null) {
    return {
      data: await this.svc.findFeatured(user?.id ?? null),
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

  // --- Admin Featured Module Actions ---

  @Patch(':id/feature')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async setFeatured(
    @Param('id') id: string,
    @Body()
    body: {
      isFeatured: boolean;
      featuredOrder?: number;
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

  @Patch(':id/reorder')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async reorderFeatured(
    @Param('id') id: string,
    @Body('direction') direction: 'up' | 'down',
  ) {
    return {
      data: await this.svc.reorderFeatured(id, direction),
      message: 'Property reordered',
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

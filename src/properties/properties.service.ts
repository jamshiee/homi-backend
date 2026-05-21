import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Property, PropertyStatus, PropertyType, TransactionType } from './entities/property.entity';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { EnquiryLog, EnquiryType } from '../enquiry-logs/enquiry-log.entity';
import { paginate, paginationMeta } from '../common/utils/pagination.util';
import { CreatePropertyDto } from './dto/create-property.dto';
import { LandDetail } from './entities/land-detail.entity';
import { HouseDetail } from './entities/house-detail.entity';
import { BuildingDetail } from './entities/building-detail.entity';
import { HotelDetail } from './entities/hotel-detail.entity';
import { PropertyAmenity } from '../amenities/property-amenity.entity';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(EnquiryLog)
    private readonly enquiryRepo: Repository<EnquiryLog>,
  ) {}

  async getDistinctDistricts(): Promise<string[]> {
    const results = await this.propertyRepo
      .createQueryBuilder('p')
      .select('DISTINCT(p.district)', 'district')
      .where('p.status = :s', { s: PropertyStatus.ACTIVE })
      .andWhere('p.deletedAt IS NULL')
      .andWhere('p.district IS NOT NULL AND p.district != :empty', { empty: '' })
      .orderBy('district', 'ASC')
      .getRawMany();

    return results.map(r => r.district);
  }

  async findFeed(filters: FilterPropertyDto) {
    const { page, limit, skip } = paginate(filters);
    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.status = :s', { s: PropertyStatus.ACTIVE })
      .andWhere('p.deletedAt IS NULL')
      .andWhere('(p.featuredUntil IS NULL OR p.featuredUntil > NOW())')
      .leftJoinAndSelect('p.propertyMedia', 'pm')
      .leftJoinAndSelect('pm.media', 'm')
      .orderBy('p.isFeatured', 'DESC')
      .addOrderBy('p.featuredOrder', 'ASC')
      .addOrderBy('p.createdAt', 'DESC');

    if (filters.type)
      qb.andWhere('p.type = :type', { type: filters.type });
    if (filters.transactionType && filters.transactionType !== TransactionType.ALL)
      qb.andWhere('p.transactionType = :tt', { tt: filters.transactionType });
    if (filters.district)
      qb.andWhere('p.district = :district', { district: filters.district });
    
    if (filters.keyword) {
      qb.andWhere(
        '(p.locality ILIKE :kw OR p.district ILIKE :kw OR p.title ILIKE :kw OR p.description ILIKE :kw)',
        { kw: `%${filters.keyword}%` }
      );
    }

    if (filters.minPrice !== undefined)
      qb.andWhere('p.price >= :minPrice', { minPrice: filters.minPrice });
    if (filters.maxPrice !== undefined)
      qb.andWhere('p.price <= :maxPrice', { maxPrice: filters.maxPrice });

    // House Filters
    if (filters.type === PropertyType.HOUSE) {
      if (filters.bedrooms || filters.bathrooms || filters.furnishingStatus) {
        qb.leftJoin('p.houseDetail', 'hd');
        if (filters.bedrooms) qb.andWhere('hd.bedrooms >= :bedrooms', { bedrooms: filters.bedrooms });
        if (filters.bathrooms) qb.andWhere('hd.bathrooms >= :bathrooms', { bathrooms: filters.bathrooms });
        if (filters.furnishingStatus) qb.andWhere('hd.furnishingStatus = :furnishingStatus', { furnishingStatus: filters.furnishingStatus });
      }
    }

    // Land Filters
    if (filters.type === PropertyType.LAND) {
      if (filters.minArea || filters.maxArea || filters.areaUnit) {
        qb.leftJoin('p.landDetail', 'ld');
        if (filters.minArea) qb.andWhere('ld.totalArea >= :minArea', { minArea: filters.minArea });
        if (filters.maxArea) qb.andWhere('ld.totalArea <= :maxArea', { maxArea: filters.maxArea });
        if (filters.areaUnit) qb.andWhere('ld.areaUnit = :areaUnit', { areaUnit: filters.areaUnit });
      }
    }

    // Building Filters
    if (filters.type === PropertyType.BUILDING) {
      if (filters.buildingSubtype) {
        qb.leftJoin('p.buildingDetail', 'bd');
        qb.andWhere('bd.propertySubtype = :subtype', { subtype: filters.buildingSubtype });
      }
    }

    // Hotel Filters
    if (filters.type === PropertyType.HOTEL) {
      if (filters.roomType) {
        qb.leftJoin('p.hotelDetail', 'hotd');
        qb.andWhere('hotd.roomType = :roomType', { roomType: filters.roomType });
      }
    }

    const total = await qb.getCount();
    const data = await qb.skip(skip).take(limit).getMany();
    return { data, meta: paginationMeta(total, page, limit) };
  }

  async findFeatured() {
    return this.propertyRepo.find({
      where: {
        status: PropertyStatus.ACTIVE,
        isFeatured: true,
        deletedAt: IsNull(),
      },
      order: { featuredOrder: 'ASC', createdAt: 'DESC' },
      take: 10,
      relations: ['propertyMedia', 'propertyMedia.media'],
    });
  }

  async findById(id: string) {
    const p = await this.propertyRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: [
        'landDetail',
        'houseDetail',
        'buildingDetail',
        'hotelDetail',
        'propertyAmenities',
        'propertyAmenities.amenity',
        'propertyMedia',
        'propertyMedia.media',
        'lister',
      ],
    });
    if (!p) throw new NotFoundException('Property not found.');
    return p;
  }

  async create(dto: CreatePropertyDto, listerId: string) {
    if (dto.type === PropertyType.HOTEL && dto.transactionType !== TransactionType.RENT) {
      throw new BadRequestException('Hotels/PG listings can only have Rent transaction type.');
    }
    if (dto.price <= 0) {
      throw new BadRequestException('Price must be greater than zero.');
    }

    return this.propertyRepo.manager.transaction(async (manager) => {
      const property = manager.create(Property, {
        title: dto.title,
        type: dto.type,
        transactionType: dto.transactionType,
        district: dto.district,
        locality: dto.locality,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        price: dto.price,
        isNegotiable: dto.isNegotiable ?? false,
        advanceAmount: dto.advanceAmount,
        priceUnit: dto.priceUnit,
        description: dto.description,
        contactPhone: dto.contactPhone,
        alternatePhone: dto.alternatePhone,
        listedByUserId: listerId,
        status: PropertyStatus.ACTIVE,
      });

      const baseSlug = dto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      property.slug = `${baseSlug}-${Date.now()}`;

      const savedProperty = await manager.save(Property, property);

      if (dto.type === PropertyType.LAND) {
        if (!dto.landDetail) {
          throw new BadRequestException('Land detail fields are required.');
        }
        const land = manager.create(LandDetail, {
          propertyId: savedProperty.id,
          totalArea: dto.landDetail.totalArea.toString(),
          areaUnit: dto.landDetail.areaUnit,
        });
        await manager.save(LandDetail, land);
      } else if (dto.type === PropertyType.HOUSE) {
        if (!dto.houseDetail) {
          throw new BadRequestException('House detail fields are required.');
        }
        const house = manager.create(HouseDetail, {
          propertyId: savedProperty.id,
          bedrooms: dto.houseDetail.bedrooms,
          bathrooms: dto.houseDetail.bathrooms,
          balconies: dto.houseDetail.balconies,
          floors: dto.houseDetail.floors,
          hasKitchen: dto.houseDetail.hasKitchen,
          furnishingStatus: dto.houseDetail.furnishingStatus,
        });
        await manager.save(HouseDetail, house);
      } else if (dto.type === PropertyType.BUILDING) {
        if (!dto.buildingDetail) {
          throw new BadRequestException('Building detail fields are required.');
        }
        const building = manager.create(BuildingDetail, {
          propertyId: savedProperty.id,
          subType: dto.buildingDetail.subType,
          totalArea: dto.buildingDetail.totalArea.toString(),
          areaUnit: dto.buildingDetail.areaUnit,
          floorNumber: dto.buildingDetail.floorNumber,
          currentStatus: dto.buildingDetail.currentStatus,
        });
        await manager.save(BuildingDetail, building);
      } else if (dto.type === PropertyType.HOTEL) {
        if (!dto.hotelDetail) {
          throw new BadRequestException('Hotel detail fields are required.');
        }
        const hotel = manager.create(HotelDetail, {
          propertyId: savedProperty.id,
          subType: dto.hotelDetail.subType,
          roomsAvailable: dto.hotelDetail.roomsAvailable,
          roomType: dto.hotelDetail.roomType,
          occupancy: dto.hotelDetail.occupancy,
          mealsIncluded: dto.hotelDetail.mealsIncluded,
          pricePerNight: dto.hotelDetail.pricePerNight ? dto.hotelDetail.pricePerNight.toString() : '0',
        });
        await manager.save(HotelDetail, hotel);
      }

      if (dto.amenityIds && dto.amenityIds.length > 0) {
        const amenitiesToSave = dto.amenityIds.map((amenityId) =>
          manager.create(PropertyAmenity, {
            propertyId: savedProperty.id,
            amenityId,
          }),
        );
        await manager.save(PropertyAmenity, amenitiesToSave);
      }

      return savedProperty;
    });
  }

  async update(id: string, dto: Record<string, unknown>) {
    await this.propertyRepo.update(id, dto as Partial<Property>);
    return this.findById(id);
  }

  async setStatus(id: string, status: PropertyStatus) {
    await this.propertyRepo.update(id, { status });
    return this.findById(id);
  }

  async setFeatured(
    id: string,
    isFeatured: boolean,
    featuredOrder: number,
    featuredUntil?: Date,
  ) {
    await this.propertyRepo.update(id, {
      isFeatured,
      featuredOrder,
      featuredUntil: featuredUntil ?? null,
    } as never);
    return this.findById(id);
  }

  async logEnquiry(
    propertyId: string,
    enquiryType: EnquiryType,
    userId?: string,
    ip?: string,
    ua?: string,
  ) {
    await this.enquiryRepo.save({
      propertyId,
      userId,
      enquiryType,
      ipAddress: ip,
      userAgent: ua,
    });
    const counter: Partial<Record<EnquiryType, keyof Property>> = {
      [EnquiryType.VIEW]: 'viewCount',
      [EnquiryType.WHATSAPP]: 'whatsappTapCount',
      [EnquiryType.PHONE_REVEAL]: 'phoneRevealCount',
    };
    const col = counter[enquiryType];
    if (col) await this.propertyRepo.increment({ id: propertyId }, col, 1);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async expireFeaturedListings() {
    await this.propertyRepo
      .createQueryBuilder()
      .update(Property)
      .set({ isFeatured: false })
      .where('featuredUntil < NOW()')
      .andWhere('isFeatured = :t', { t: true })
      .execute();
    this.logger.log('Featured listing expiry complete');
  }
}

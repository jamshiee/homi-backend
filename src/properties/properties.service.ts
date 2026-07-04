import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  Property,
  PropertyStatus,
  PropertyType,
  TransactionType,
  ModerationStatus,
} from './entities/property.entity';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { EnquiryLog, EnquiryType } from '../enquiry-logs/enquiry-log.entity';
import { paginate, paginationMeta } from '../common/utils/pagination.util';
import { CreatePropertyDto } from './dto/create-property.dto';
import {
  UpdatePropertyDto,
  UpdatePropertyMediaSyncDto,
} from './dto/update-property.dto';
import { LandDetail } from './entities/land-detail.entity';
import { HouseDetail } from './entities/house-detail.entity';
import { BuildingDetail } from './entities/building-detail.entity';
import { HotelDetail } from './entities/hotel-detail.entity';
import { PropertyAmenity } from '../amenities/property-amenity.entity';
import { PropertyMedia } from '../media/entities/property-media.entity';
import { Media } from '../media/entities/media.entity';
import { SavedProperty } from '../saved-properties/saved-property.entity';
import { User } from '../users/users.entity';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(EnquiryLog)
    private readonly enquiryRepo: Repository<EnquiryLog>,
    @InjectRepository(SavedProperty)
    private readonly savedRepo: Repository<SavedProperty>,
    private readonly config: ConfigService,
  ) {}

  /**
   * Given a list of property IDs and an optional userId, returns a Set
   * of property IDs that the user has saved. Used to annotate feed/featured
   * results without N+1 queries.
   */
  private async getSavedSet(
    propertyIds: string[],
    userId?: string | null,
  ): Promise<Set<string>> {
    if (!userId || propertyIds.length === 0) return new Set();
    const rows = await this.savedRepo.find({
      where: { userId, propertyId: In(propertyIds) },
      select: ['propertyId'],
    });
    return new Set(rows.map((r) => r.propertyId));
  }

  /** Annotate an array of Property objects with isSaved boolean. */
  private annotateWithSaved<T extends Property>(
    items: T[],
    savedSet: Set<string>,
  ): (T & { isSaved: boolean })[] {
    return items.map((p) => ({
      ...p,
      isSaved: savedSet.has(p.id),
    })) as (T & { isSaved: boolean })[];
  }

  async getDistinctDistricts(): Promise<string[]> {
    const results = await this.propertyRepo
      .createQueryBuilder('p')
      .select('DISTINCT(p.district)', 'district')
      .where('p.status = :s', { s: PropertyStatus.ACTIVE })
      .andWhere('p.moderationStatus = :ms', { ms: ModerationStatus.APPROVED })
      .andWhere('p.deletedAt IS NULL')
      .andWhere('p.district IS NOT NULL AND p.district != :empty', {
        empty: '',
      })
      .orderBy('district', 'ASC')
      .getRawMany();

    return results.map((r) => r.district);
  }

  async getDistinctLocalities(district?: string): Promise<string[]> {
    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .select('DISTINCT(p.locality)', 'locality')
      .where('p.status = :s', { s: PropertyStatus.ACTIVE })
      .andWhere('p.moderationStatus = :ms', { ms: ModerationStatus.APPROVED })
      .andWhere('p.deletedAt IS NULL')
      .andWhere('p.locality IS NOT NULL AND p.locality != :empty', { empty: '' });
    if (district)
      qb.andWhere('p.district = :district', { district });
    const results = await qb.orderBy('locality', 'ASC').getRawMany();
    return results.map((r) => r.locality);
  }

  async findFeed(filters: FilterPropertyDto, userId?: string | null) {
    const { page, limit, skip } = paginate(filters);
    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.status = :s', { s: PropertyStatus.ACTIVE })
      .andWhere('p.moderationStatus = :ms', { ms: ModerationStatus.APPROVED })
      .andWhere('p.deletedAt IS NULL')
      .andWhere('(p.featuredUntil IS NULL OR p.featuredUntil > NOW())')
      .leftJoinAndSelect('p.propertyMedia', 'pm')
      .leftJoinAndSelect('p.landDetail', 'land')
      .leftJoinAndSelect('p.houseDetail', 'house')
      .leftJoinAndSelect('p.buildingDetail', 'building')
      .leftJoinAndSelect('p.hotelDetail', 'hotel')
      .leftJoinAndSelect('p.lister', 'lister')
      .leftJoinAndSelect('lister.profileMedia', 'listerMedia')
      .leftJoinAndSelect('pm.media', 'm');

    const hasLocalityAndDistrict = filters.locality && filters.district;

    if (hasLocalityAndDistrict) {
      qb.addSelect(
        `CASE WHEN p.locality ILIKE :locMatch THEN 0 ELSE 1 END`,
        'locality_priority',
      );
      qb.setParameter('locMatch', `%${filters.locality}%`);
    }

    const applyBaseSort = () => {
      if (hasLocalityAndDistrict) {
        qb.orderBy('locality_priority', 'ASC');
        qb.addOrderBy('p.isFeatured', 'DESC');
      } else {
        qb.orderBy('p.isFeatured', 'DESC');
      }
      qb.addOrderBy('p.featuredOrder', 'ASC');
      qb.addOrderBy('p.createdAt', 'DESC');
    };

    // Apply sort override when explicitly requested
    if (filters.sort === 'price_asc') {
      if (hasLocalityAndDistrict) {
        qb.orderBy('locality_priority', 'ASC').addOrderBy('p.price', 'ASC');
      } else {
        qb.orderBy('p.price', 'ASC');
      }
    } else if (filters.sort === 'price_desc') {
      if (hasLocalityAndDistrict) {
        qb.orderBy('locality_priority', 'ASC').addOrderBy('p.price', 'DESC');
      } else {
        qb.orderBy('p.price', 'DESC');
      }
    } else if (filters.sort === 'relevance') {
      if (hasLocalityAndDistrict) {
        qb.orderBy('locality_priority', 'ASC')
          .addOrderBy('p.isFeatured', 'DESC')
          .addOrderBy('p.viewCount', 'DESC')
          .addOrderBy('p.createdAt', 'DESC');
      } else {
        qb.orderBy('p.isFeatured', 'DESC')
          .addOrderBy('p.viewCount', 'DESC')
          .addOrderBy('p.createdAt', 'DESC');
      }
    } else {
      applyBaseSort();
    }

    if (filters.type && filters.type.length > 0) {
      qb.andWhere('p.type IN (:...types)', { types: filters.type });
    }
    if (
      filters.transactionType &&
      filters.transactionType !== TransactionType.ALL
    ) {
      qb.andWhere('p.transactionType = :tt', { tt: filters.transactionType });
    }
    
    if (filters.district) {
      qb.andWhere('p.district = :district', { district: filters.district });
    } else if (filters.locality) {
      qb.andWhere('p.locality ILIKE :locality', { locality: `%${filters.locality}%` });
    }

    if (filters.keyword) {
      qb.andWhere(
        '(p.locality ILIKE :kw OR p.district ILIKE :kw OR p.title ILIKE :kw OR p.description ILIKE :kw OR p.serialNo ILIKE :kw)',
        { kw: `%${filters.keyword}%` },
      );
    }

    if (filters.minPrice !== undefined)
      qb.andWhere('p.price >= :minPrice', { minPrice: filters.minPrice });
    if (filters.maxPrice !== undefined)
      qb.andWhere('p.price <= :maxPrice', { maxPrice: filters.maxPrice });

    if (filters.type?.includes(PropertyType.HOUSE)) {
      if (filters.bedrooms || filters.bathrooms || filters.furnishingStatus) {
        qb.leftJoin('p.houseDetail', 'hd');
        if (filters.bedrooms)
          qb.andWhere('hd.bedrooms >= :bedrooms', {
            bedrooms: filters.bedrooms,
          });
        if (filters.bathrooms)
          qb.andWhere('hd.bathrooms >= :bathrooms', {
            bathrooms: filters.bathrooms,
          });
        if (filters.furnishingStatus)
          qb.andWhere('hd.furnishingStatus = :furnishingStatus', {
            furnishingStatus: filters.furnishingStatus,
          });
      }
    }

    if (filters.type?.includes(PropertyType.LAND)) {
      if (filters.minArea || filters.maxArea || filters.areaUnit) {
        qb.leftJoin('p.landDetail', 'ld');
        if (filters.minArea)
          qb.andWhere('ld.totalArea >= :minArea', { minArea: filters.minArea });
        if (filters.maxArea)
          qb.andWhere('ld.totalArea <= :maxArea', { maxArea: filters.maxArea });
        if (filters.areaUnit)
          qb.andWhere('ld.areaUnit = :areaUnit', {
            areaUnit: filters.areaUnit,
          });
      }
    }

    if (filters.type?.includes(PropertyType.BUILDING)) {
      if (filters.buildingSubtype) {
        qb.leftJoin('p.buildingDetail', 'bd');
        qb.andWhere('bd.propertySubtype = :subtype', {
          subtype: filters.buildingSubtype,
        });
      }
    }

    if (filters.type?.includes(PropertyType.HOTEL)) {
      if (filters.hotelSubtype || filters.roomType || filters.hotelCategory) {
        qb.leftJoin('p.hotelDetail', 'hotd');
        if (filters.hotelSubtype) {
          qb.andWhere('hotd.subType = :hotelSubtype', {
            hotelSubtype: filters.hotelSubtype,
          });
        }
        if (filters.roomType) {
          qb.andWhere('hotd.roomType = :roomType', {
            roomType: filters.roomType,
          });
        }
        if (filters.hotelCategory) {
          qb.andWhere('hotd.hotelCategory = :hotelCategory', {
            hotelCategory: filters.hotelCategory,
          });
        }
      }
    }

    const total = await qb.getCount();
    const data = await qb.skip(skip).take(limit).getMany();
    const savedSet = await this.getSavedSet(data.map((p) => p.id), userId);
    return { data: this.annotateWithSaved(data, savedSet), meta: paginationMeta(total, page, limit) };
  }

  async findByUser(userId: string, filters: FilterPropertyDto) {
    const { page, limit, skip } = paginate(filters);
    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.deletedAt IS NULL')
      .andWhere('p.listedByUserId = :userId', { userId })
      .leftJoinAndSelect('p.propertyMedia', 'pm')
      .leftJoinAndSelect('pm.media', 'm')
      .leftJoinAndSelect('p.lister', 'lister')
      .orderBy('p.isFeatured', 'DESC')
      .addOrderBy('p.featuredOrder', 'ASC')
      .addOrderBy('p.createdAt', 'DESC');

    const total = await qb.getCount();
    const data = await qb.skip(skip).take(limit).getMany();
    return { data, meta: paginationMeta(total, page, limit) };
  }

  async findFeatured(
    userId?: string | null,
    district?: string,
    locality?: string,
  ) {
    // When no location filter is requested, use the fast .find() path
    if (!district && !locality) {
      const items = await this.propertyRepo.find({
        where: {
          status: PropertyStatus.ACTIVE,
          moderationStatus: ModerationStatus.APPROVED,
          isFeatured: true,
          deletedAt: IsNull(),
        },
        order: { featuredOrder: 'ASC', createdAt: 'DESC' },
        take: 10,
        relations: [
          'propertyMedia',
          'propertyMedia.media',
          'lister',
          'lister.profileMedia',
        ],
      });
      const savedSet = await this.getSavedSet(items.map((p) => p.id), userId);
      return this.annotateWithSaved(items, savedSet);
    }

    // Location-filtered path
    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.status = :s', { s: PropertyStatus.ACTIVE })
      .andWhere('p.moderationStatus = :ms', { ms: ModerationStatus.APPROVED })
      .andWhere('p.isFeatured = true')
      .andWhere('p.deletedAt IS NULL')
      .leftJoinAndSelect('p.propertyMedia', 'pm')
      .leftJoinAndSelect('pm.media', 'm')
      .leftJoinAndSelect('p.lister', 'lister')
      .leftJoinAndSelect('lister.profileMedia', 'listerMedia');

    if (district && locality) {
      qb.addSelect(
        `CASE WHEN p.locality = :locMatch THEN 0 ELSE 1 END`,
        'locality_priority'
      );
      qb.setParameter('locMatch', locality);
      qb.orderBy('locality_priority', 'ASC');
      qb.addOrderBy('p.featuredOrder', 'ASC');
      qb.addOrderBy('p.createdAt', 'DESC');
      qb.andWhere('p.district = :district', { district });
    } else {
      qb.orderBy('p.featuredOrder', 'ASC');
      qb.addOrderBy('p.createdAt', 'DESC');
      
      if (district)
        qb.andWhere('p.district = :district', { district });
      else if (locality)
        qb.andWhere('p.locality = :locality', { locality });
    }

    const items = await qb.take(10).getMany();
    const savedSet = await this.getSavedSet(items.map((p) => p.id), userId);
    return this.annotateWithSaved(items, savedSet);
  }

  async findAdminFeatured() {
    return this.propertyRepo.find({
      where: {
        isFeatured: true,
        deletedAt: IsNull(),
      },
      order: { featuredOrder: 'ASC', createdAt: 'DESC' },
      relations: ['propertyMedia', 'propertyMedia.media', 'lister'],
    });
  }

  async findAdminAll(filters: FilterPropertyDto) {
    const { page, limit, skip } = paginate(filters);
    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .where('p.deletedAt IS NULL')
      .leftJoinAndSelect('p.propertyMedia', 'pm')
      .leftJoinAndSelect('pm.media', 'm')
      .leftJoinAndSelect('p.lister', 'lister')
      .orderBy('p.createdAt', 'DESC');

    if (filters.type && filters.type.length > 0) {
      qb.andWhere('p.type IN (:...types)', { types: filters.type });
    }
    if (filters.status) qb.andWhere('p.status = :status', { status: filters.status });
    if (filters.moderationStatus) qb.andWhere('p.moderationStatus = :ms', { ms: filters.moderationStatus });
    if (filters.isFeatured !== undefined) qb.andWhere('p.isFeatured = :feat', { feat: filters.isFeatured });
    if (filters.serialNo) qb.andWhere('p.serialNo = :serialNo', { serialNo: filters.serialNo.toUpperCase() });
    if (
      filters.transactionType &&
      filters.transactionType !== TransactionType.ALL
    ) {
      qb.andWhere('p.transactionType = :tt', { tt: filters.transactionType });
    }
    if (filters.district) {
      qb.andWhere('p.district = :district', { district: filters.district });
    }
    if (filters.keyword) {
      qb.andWhere(
        '(p.locality ILIKE :kw OR p.district ILIKE :kw OR p.title ILIKE :kw OR p.description ILIKE :kw OR p.serialNo ILIKE :kw)',
        { kw: `%${filters.keyword}%` },
      );
    }

    const total = await qb.getCount();
    const data = await qb.skip(skip).take(limit).getMany();
    return { data, meta: paginationMeta(total, page, limit) };
  }

  async findById(id: string, requestingUserId?: string, isAdmin = false) {
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
        'lister.profileMedia',
      ],
    });
    if (!p) throw new NotFoundException('Property not found.');

    // Block non-approved properties from public view
    if (p.moderationStatus !== ModerationStatus.APPROVED) {
      const isOwner = requestingUserId && p.listedByUserId === requestingUserId;
      if (!isOwner && !isAdmin) {
        throw new NotFoundException('Property not found.');
      }
    }

    return p;
  }

  async create(dto: CreatePropertyDto, lister: User) {
    if (
      dto.type === PropertyType.HOTEL &&
      dto.transactionType !== TransactionType.RENT
    ) {
      throw new BadRequestException(
        'Hotels/PG listings can only have Rent transaction type.',
      );
    }
    if (dto.price <= 0) {
      throw new BadRequestException('Price must be greater than zero.');
    }

    const adminNumbers = this.config.get<string[]>('admin.numbers') || [];
    const isAdmin = adminNumbers.includes(lister.phone);
    // Admins bypass moderation; regular users start as PENDING
    const moderationStatus = isAdmin
      ? ModerationStatus.APPROVED
      : ModerationStatus.PENDING;

    return this.propertyRepo.manager.transaction(async (manager) => {
      // Advisory lock prevents concurrent transactions from picking the same
      // serial number. Lock key 9876543 is arbitrary but unique to this operation.
      await manager.query(`SELECT pg_advisory_xact_lock(9876543)`);

      // Derive next serial number: find current MAX numeric suffix, start at 5000
      const result = await manager.query(
        `SELECT serial_no FROM property WHERE serial_no IS NOT NULL ORDER BY serial_no DESC LIMIT 1`,
      );
      let nextNum = 5001;
      if (result.length > 0) {
        const lastSerial: string = result[0].serial_no;
        const lastNum = parseInt(lastSerial.replace('HH', ''), 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      const serialNo = `HH${nextNum}`;
      const property = manager.create(Property, {
        serialNo,
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
        isVerified: dto.isVerified ?? false,
        advanceAmount: dto.advanceAmount,
        priceUnit: dto.priceUnit,
        description: dto.description,
        contactPhone: dto.contactPhone,
        alternatePhone: dto.alternatePhone,
        listedByUserId: lister.id,
        status: PropertyStatus.ACTIVE,
        moderationStatus,
      });

      const baseSlug = dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
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
          roomType: dto.hotelDetail.roomType,
          occupancy: dto.hotelDetail.occupancy,
          mealsIncluded: dto.hotelDetail.mealsIncluded,
          hotelCategory: dto.hotelDetail.hotelCategory,
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

  async update(id: string, dto: UpdatePropertyDto, editor: User) {
    const property = await this.assertPropertyOwner(id, editor.id);

    if ('type' in dto && dto.type !== undefined && dto.type !== property.type) {
      throw new BadRequestException('Property type cannot be changed.');
    }

    const adminNumbers = this.config.get<string[]>('admin.numbers') || [];
    const isAdmin = adminNumbers.includes(editor.phone);
    const reApproveOnEdit = this.config.get<boolean>('moderation.reApproveOnEdit') ?? true;
    const maxAppeals = this.config.get<number>('moderation.maxAppeals') ?? 3;

    // Determine new moderation status after edit
    let newModerationStatus: ModerationStatus | undefined;
    let newAppealCount: number | undefined;
    let newRejectionReason: string | null | undefined;

    if (!isAdmin) {
      if (property.moderationStatus === ModerationStatus.REJECTED) {
        // Check appeal limit
        if (maxAppeals > 0 && property.appealCount >= maxAppeals) {
          throw new BadRequestException(
            `Maximum resubmissions (${maxAppeals}) reached. Please contact support.`,
          );
        }
        newModerationStatus = ModerationStatus.PENDING;
        newAppealCount = property.appealCount + 1;
        newRejectionReason = null; // clear rejection reason on resubmit
      } else if (
        property.moderationStatus === ModerationStatus.APPROVED &&
        reApproveOnEdit
      ) {
        newModerationStatus = ModerationStatus.PENDING;
        newRejectionReason = null;
      }
    }

    return this.propertyRepo.manager.transaction(async (manager) => {
      const coreUpdate: Partial<Property> = {};
      if (dto.title !== undefined) coreUpdate.title = dto.title;
      if (dto.transactionType !== undefined)
        coreUpdate.transactionType = dto.transactionType;
      if (dto.district !== undefined) coreUpdate.district = dto.district;
      if (dto.locality !== undefined) coreUpdate.locality = dto.locality;
      if (dto.address !== undefined) coreUpdate.address = dto.address;
      if (dto.latitude !== undefined) coreUpdate.latitude = dto.latitude;
      if (dto.longitude !== undefined) coreUpdate.longitude = dto.longitude;
      if (dto.price !== undefined) coreUpdate.price = dto.price;
      if (dto.isNegotiable !== undefined)
        coreUpdate.isNegotiable = dto.isNegotiable;
      if (dto.isVerified !== undefined)
        coreUpdate.isVerified = dto.isVerified;
      if (dto.advanceAmount !== undefined)
        coreUpdate.advanceAmount = dto.advanceAmount;
      if (dto.priceUnit !== undefined) coreUpdate.priceUnit = dto.priceUnit;
      if (dto.description !== undefined)
        coreUpdate.description = dto.description;
      if (dto.contactPhone !== undefined)
        coreUpdate.contactPhone = dto.contactPhone;
      if (dto.alternatePhone !== undefined)
        coreUpdate.alternatePhone = dto.alternatePhone;

      // Apply moderation state changes
      if (newModerationStatus !== undefined)
        coreUpdate.moderationStatus = newModerationStatus;
      if (newAppealCount !== undefined)
        coreUpdate.appealCount = newAppealCount;
      if (newRejectionReason !== undefined)
        (coreUpdate as any).rejectionReason = newRejectionReason;

      if (Object.keys(coreUpdate).length > 0) {
        await manager.update(Property, { id }, coreUpdate);
      }

      if (dto.landDetail !== undefined) {
        await this.upsertLandDetail(manager, id, dto.landDetail);
      }
      if (dto.houseDetail !== undefined) {
        await this.upsertHouseDetail(manager, id, dto.houseDetail);
      }
      if (dto.buildingDetail !== undefined) {
        await this.upsertBuildingDetail(manager, id, dto.buildingDetail);
      }
      if (dto.hotelDetail !== undefined) {
        await this.upsertHotelDetail(manager, id, dto.hotelDetail);
      }
      if (dto.amenityIds !== undefined) {
        await manager.delete(PropertyAmenity, { propertyId: id });
        if (dto.amenityIds.length > 0) {
          await manager.save(
            PropertyAmenity,
            dto.amenityIds.map((amenityId) => ({ propertyId: id, amenityId })),
          );
        }
      }
      if (dto.mediaSync !== undefined) {
        await this.syncMedia(manager, id, dto.mediaSync);
      }

      return this.findById(id);
    });
  }

  async setStatus(id: string, status: PropertyStatus) {
    await this.propertyRepo.update(id, { status });
    return this.findById(id);
  }

  async moderate(
    id: string,
    status: ModerationStatus.APPROVED | ModerationStatus.REJECTED,
    rejectionReason?: string,
  ) {
    const update: Partial<Property> = { moderationStatus: status };
    if (status === ModerationStatus.APPROVED) {
      update.rejectionReason = null;
    } else {
      update.rejectionReason = rejectionReason ?? null;
    }
    await this.propertyRepo.update(id, update as any);
    return this.findById(id,undefined,true);
  }

  async setFeatured(
    id: string,
    isFeatured: boolean,
    featuredOrder?: number,
    featuredUntil?: Date,
  ) {
    return this.propertyRepo.manager.transaction(async (manager) => {
      const property = await manager.findOne(Property, { where: { id } });
      if (!property) throw new NotFoundException('Property not found');

      let targetOrder = property.featuredOrder;

      if (isFeatured) {
        if (featuredOrder !== undefined && featuredOrder > 0) {
          // Shift properties at or below this position down by 1
          await manager
            .createQueryBuilder()
            .update(Property)
            .set({ featuredOrder: () => 'featured_order + 1' })
            .where('is_featured = true')
            .andWhere('featured_order >= :target', { target: featuredOrder })
            .execute();
          targetOrder = featuredOrder;
        } else if (!property.isFeatured) {
          // If newly featured and no position given, append at the end
          const maxOrderRes = await manager
            .createQueryBuilder(Property, 'p')
            .select('MAX(p.featuredOrder)', 'max')
            .where('p.isFeatured = true')
            .getRawOne();
          targetOrder = (maxOrderRes?.max || 0) + 1;
        }
      } else {
        // Unfeatured properties get reset
        targetOrder = 0;
      }

      await manager.update(Property, id, {
        isFeatured,
        featuredOrder: targetOrder,
        featuredUntil: featuredUntil ?? null,
      } as never);

      await this.resequenceFeaturedProperties(manager);

      return manager.findOne(Property, {
        where: { id },
        relations: ['propertyMedia', 'propertyMedia.media', 'lister'],
      });
    });
  }

  async reorderFeatured(id: string, direction: 'up' | 'down') {
    return this.propertyRepo.manager.transaction(async (manager) => {
      const property = await manager.findOne(Property, { where: { id } });
      if (!property || !property.isFeatured) {
        throw new BadRequestException('Property is not featured');
      }

      const currentOrder = property.featuredOrder;
      
      let swapProperty: Property | null = null;
      if (direction === 'up') {
        swapProperty = await manager
          .createQueryBuilder(Property, 'p')
          .where('p.isFeatured = true')
          .andWhere('p.featuredOrder < :currentOrder', { currentOrder })
          .orderBy('p.featuredOrder', 'DESC')
          .getOne();
      } else {
        swapProperty = await manager
          .createQueryBuilder(Property, 'p')
          .where('p.isFeatured = true')
          .andWhere('p.featuredOrder > :currentOrder', { currentOrder })
          .orderBy('p.featuredOrder', 'ASC')
          .getOne();
      }

      if (!swapProperty) return property;

      const swapOrder = swapProperty.featuredOrder;

      await manager.update(Property, id, { featuredOrder: swapOrder });
      await manager.update(Property, swapProperty.id, { featuredOrder: currentOrder });

      return manager.findOne(Property, {
        where: { id },
        relations: ['propertyMedia', 'propertyMedia.media', 'lister'],
      });
    });
  }

  async remove(id: string, userId: string) {
    const property = await this.assertPropertyOwner(id, userId);

    return this.propertyRepo.manager.transaction(async (manager) => {
      // Soft delete all property amenities
      await manager.softDelete(PropertyAmenity, { propertyId: id });

      // Soft delete all property media and their associated media objects
      const propertyMediaRecords = await manager.find(PropertyMedia, {
        where: { propertyId: id },
      });

      for (const pm of propertyMediaRecords) {
        await manager.softDelete(PropertyMedia, { id: pm.id });
        await manager.softDelete(Media, { id: pm.mediaId });
      }

      // Soft delete type-specific details based on property type
      if (property.type === PropertyType.LAND) {
        await manager.softDelete(LandDetail, { propertyId: id });
      } else if (property.type === PropertyType.HOUSE) {
        await manager.softDelete(HouseDetail, { propertyId: id });
      } else if (property.type === PropertyType.BUILDING) {
        await manager.softDelete(BuildingDetail, { propertyId: id });
      } else if (property.type === PropertyType.HOTEL) {
        await manager.softDelete(HotelDetail, { propertyId: id });
      }

      // Soft delete all saved properties (when users save this property)
      await manager.softDelete(SavedProperty, { propertyId: id });

      // Finally, soft delete the property itself
      await manager.softDelete(Property, { id });

      if (property.isFeatured) {
        await this.resequenceFeaturedProperties(manager);
      }
    });
  }

  async logEnquiry(
    propertyId: string,
    enquiryType: EnquiryType,
    userId?: string,
    ip?: string,
    ua?: string,
  ) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const qb = this.enquiryRepo
      .createQueryBuilder('el')
      .where('el.propertyId = :propertyId', { propertyId })
      .andWhere('el.enquiryType = :enquiryType', { enquiryType })
      .andWhere('el.createdAt > :since', { since });

    if (userId) {
      qb.andWhere('el.userId = :userId', { userId });
    } else if (ip) {
      qb.andWhere('el.ipAddress = :ip', { ip });
    }

    const existing = await qb.getOne();
    if (existing) {
      this.logger.debug(
        `Duplicate enquiry skipped: ${enquiryType} on ${propertyId}`,
      );
      return;
    }

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

  async findRelated(id: string): Promise<Property[]> {
    const target = await this.propertyRepo.findOne({
      where: { id, deletedAt: IsNull() },
      select: ['id', 'district', 'type'],
    });
    if (!target) return [];

    const { district, type } = target;

    return this.propertyRepo
      .createQueryBuilder('p')
      .where('p.status = :s', { s: PropertyStatus.ACTIVE })
      .andWhere('p.moderationStatus = :ms', { ms: ModerationStatus.APPROVED })
      .andWhere('p.deletedAt IS NULL')
      .andWhere('p.id != :id', { id })
      .andWhere('p.district = :district', { district })
      .leftJoinAndSelect('p.propertyMedia', 'pm')
      .leftJoinAndSelect('pm.media', 'm')
      .leftJoinAndSelect('p.landDetail', 'ld')
      .leftJoinAndSelect('p.houseDetail', 'hd')
      .leftJoinAndSelect('p.buildingDetail', 'bd')
      .leftJoinAndSelect('p.hotelDetail', 'hotd')
      .addSelect(`CASE WHEN p.type = :type THEN 0 ELSE 1 END`, 'type_priority')
      .addSelect(
        `
  CASE
    WHEN p.isFeatured = true THEN 0
    ELSE 1
  END
  `,
        'featured_priority',
      )
      .setParameter('type', type)
      .orderBy('featured_priority', 'ASC')
      .addOrderBy('type_priority', 'ASC')
      .addOrderBy('p.createdAt', 'DESC')
      .take(5)
      .getMany();
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async expireFeaturedListings() {
    await this.propertyRepo.manager.transaction(async (manager) => {
      const expiredProps = await manager
        .createQueryBuilder(Property, 'p')
        .where('p.featuredUntil < NOW()')
        .andWhere('p.isFeatured = :t', { t: true })
        .getMany();

      if (expiredProps.length === 0) return;

      await manager
        .createQueryBuilder()
        .update(Property)
        .set({ isFeatured: false, featuredOrder: 0 })
        .whereInIds(expiredProps.map((p) => p.id))
        .execute();

      await this.resequenceFeaturedProperties(manager);
    });
    this.logger.log('Featured listing expiry complete');
  }

  private async assertPropertyOwner(id: string, userId: string) {
    const property = await this.propertyRepo.findOne({
      where: { id, deletedAt: IsNull() },
      select: ['id', 'listedByUserId', 'type', 'isFeatured', 'featuredOrder'],
    });

    if (!property) throw new NotFoundException('Property not found.');
    if (property.listedByUserId !== userId) {
      throw new ForbiddenException(
        'Only listing owner can edit this property.',
      );
    }

    return property;
  }

  private async resequenceFeaturedProperties(manager?: any) {
    const mgr = manager || this.propertyRepo.manager;
    const remainingProps = await mgr.find(Property, {
      where: { isFeatured: true, deletedAt: IsNull() },
      order: { featuredOrder: 'ASC' },
    });

    for (let i = 0; i < remainingProps.length; i++) {
      if (remainingProps[i].featuredOrder !== i + 1) {
        await mgr.update(Property, remainingProps[i].id, { featuredOrder: i + 1 });
      }
    }
  }

  private async upsertLandDetail(
    manager: any,
    propertyId: string,
    detail: UpdatePropertyDto['landDetail'],
  ) {
    if (!detail) return;
    const existing = await manager.findOne(LandDetail, {
      where: { propertyId },
    });
    const payload = {
      propertyId,
      totalArea: detail.totalArea?.toString(),
      areaUnit: detail.areaUnit,
    };

    if (existing) {
      await manager.update(LandDetail, { id: existing.id }, payload);
      return;
    }

    await manager.save(LandDetail, payload);
  }

  private async upsertHouseDetail(
    manager: any,
    propertyId: string,
    detail: UpdatePropertyDto['houseDetail'],
  ) {
    if (!detail) return;
    const existing = await manager.findOne(HouseDetail, {
      where: { propertyId },
    });
    const payload = {
      propertyId,
      bedrooms: detail.bedrooms,
      bathrooms: detail.bathrooms,
      balconies: detail.balconies,
      floors: detail.floors,
      hasKitchen: detail.hasKitchen,
      furnishingStatus: detail.furnishingStatus,
    };

    if (existing) {
      await manager.update(HouseDetail, { id: existing.id }, payload);
      return;
    }

    await manager.save(HouseDetail, payload);
  }

  private async upsertBuildingDetail(
    manager: any,
    propertyId: string,
    detail: UpdatePropertyDto['buildingDetail'],
  ) {
    if (!detail) return;
    const existing = await manager.findOne(BuildingDetail, {
      where: { propertyId },
    });
    const payload = {
      propertyId,
      subType: detail.subType,
      totalArea: detail.totalArea?.toString(),
      areaUnit: detail.areaUnit,
      floorNumber: detail.floorNumber,
      currentStatus: detail.currentStatus,
    };

    if (existing) {
      await manager.update(BuildingDetail, { id: existing.id }, payload);
      return;
    }

    await manager.save(BuildingDetail, payload);
  }

  private async upsertHotelDetail(
    manager: any,
    propertyId: string,
    detail: UpdatePropertyDto['hotelDetail'],
  ) {
    if (!detail) return;
    const existing = await manager.findOne(HotelDetail, {
      where: { propertyId },
    });
    const payload = {
      propertyId,
      subType: detail.subType,
      roomType: detail.roomType,
      occupancy: detail.occupancy,
      mealsIncluded: detail.mealsIncluded,
      hotelCategory: detail.hotelCategory,
    };

    if (existing) {
      await manager.update(HotelDetail, { id: existing.id }, payload);
      return;
    }

    await manager.save(HotelDetail, payload);
  }

  private async syncMedia(
    manager: any,
    propertyId: string,
    mediaSync: UpdatePropertyMediaSyncDto,
  ) {
    const currentMedia = await manager.find(PropertyMedia, {
      where: { propertyId },
    });

    if (mediaSync.removedPropertyMediaIds?.length) {
      for (const propertyMediaId of mediaSync.removedPropertyMediaIds) {
        const match = currentMedia.find(
          (item: PropertyMedia) => item.id === propertyMediaId,
        );
        if (!match) continue;

        await manager.delete(PropertyMedia, { id: propertyMediaId });
        await manager.softDelete(Media, { id: match.mediaId });
      }
    }

    if (mediaSync.coverPropertyMediaId) {
      await manager.update(PropertyMedia, { propertyId }, { isCover: false });
      await manager.update(
        PropertyMedia,
        { id: mediaSync.coverPropertyMediaId },
        { isCover: true },
      );
    }

    if (mediaSync.sortOrderByPropertyMediaId) {
      for (const [propertyMediaId, sortOrder] of Object.entries(
        mediaSync.sortOrderByPropertyMediaId,
      )) {
        await manager.update(
          PropertyMedia,
          { id: propertyMediaId },
          { sortOrder },
        );
      }
    }
  }
}

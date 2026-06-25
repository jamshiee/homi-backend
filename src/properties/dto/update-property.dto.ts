import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PriceUnit,
  PropertyType,
  TransactionType,
} from '../entities/property.entity';
import { FurnishingStatusEnum } from '../entities/house-detail.entity';
import {
  AreaUnitEnum,
  BuildingStatusEnum,
  BuildingSubTypeEnum,
} from '../entities/building-detail.entity';
import {
  HotelSubTypeEnum,
  RoomTypeEnum,
  HotelCategoryEnum,
} from '../entities/hotel-detail.entity';

class UpdateLandDetailDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalArea?: number;

  @IsOptional()
  @IsEnum(AreaUnitEnum)
  areaUnit?: AreaUnitEnum;
}

class UpdateHouseDetailDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balconies?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  floors?: number;

  @IsOptional()
  @IsBoolean()
  hasKitchen?: boolean;

  @IsOptional()
  @IsEnum(FurnishingStatusEnum)
  furnishingStatus?: FurnishingStatusEnum;
}

class UpdateBuildingDetailDto {
  @IsOptional()
  @IsEnum(BuildingSubTypeEnum)
  subType?: BuildingSubTypeEnum;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalArea?: number;

  @IsOptional()
  @IsEnum(AreaUnitEnum)
  areaUnit?: AreaUnitEnum;

  @IsOptional()
  @IsNumber()
  floorNumber?: number;

  @IsOptional()
  @IsEnum(BuildingStatusEnum)
  currentStatus?: BuildingStatusEnum;
}

class UpdateHotelDetailDto {
  @IsOptional()
  @IsEnum(HotelSubTypeEnum)
  subType?: HotelSubTypeEnum;

  @IsOptional()
  @IsEnum(RoomTypeEnum)
  roomType?: RoomTypeEnum;

  @IsOptional()
  @IsNumber()
  occupancy?: number;

  @IsOptional()
  @IsBoolean()
  mealsIncluded?: boolean;

  @IsOptional()
  @IsEnum(HotelCategoryEnum)
  hotelCategory?: HotelCategoryEnum;
}

export class UpdatePropertyMediaSyncDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedPropertyMediaIds?: string[];

  @IsOptional()
  @IsString()
  coverPropertyMediaId?: string;

  @IsOptional()
  @IsObject()
  sortOrderByPropertyMediaId?: Record<string, number>;
}

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  locality?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceAmount?: number;

  @IsOptional()
  @IsEnum(PriceUnit)
  priceUnit?: PriceUnit;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateLandDetailDto)
  landDetail?: UpdateLandDetailDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateHouseDetailDto)
  houseDetail?: UpdateHouseDetailDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBuildingDetailDto)
  buildingDetail?: UpdateBuildingDetailDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateHotelDetailDto)
  hotelDetail?: UpdateHotelDetailDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenityIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePropertyMediaSyncDto)
  mediaSync?: UpdatePropertyMediaSyncDto;
}

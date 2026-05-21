import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, TransactionType, PriceUnit } from '../entities/property.entity';
import { FurnishingStatusEnum } from '../entities/house-detail.entity';
import { BuildingSubTypeEnum } from '../entities/building-detail.entity';
import { HotelSubTypeEnum, RoomTypeEnum, OccupancyTypeEnum } from '../entities/hotel-detail.entity';

export class LandDetailDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalArea: number;

  @IsNotEmpty()
  @IsString()
  areaUnit: string;

  @IsOptional()
  @IsBoolean()
  hasRoadAccess?: boolean;
}

export class HouseDetailDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  bedrooms: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  bathrooms: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  balconies: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  floors: number;

  @IsNotEmpty()
  @IsBoolean()
  hasKitchen: boolean;

  @IsNotEmpty()
  @IsEnum(FurnishingStatusEnum)
  furnishingStatus: FurnishingStatusEnum;
}

export class BuildingDetailDto {
  @IsNotEmpty()
  @IsEnum(BuildingSubTypeEnum)
  subType: BuildingSubTypeEnum;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalArea: number;

  @IsNotEmpty()
  @IsString()
  areaUnit: string;

  @IsNotEmpty()
  @IsNumber()
  floorNumber: number;

  @IsNotEmpty()
  @IsString()
  currentStatus: string;

  @IsOptional()
  @IsBoolean()
  hasRoadAccess?: boolean;
}

export class HotelDetailDto {
  @IsNotEmpty()
  @IsEnum(HotelSubTypeEnum)
  subType: HotelSubTypeEnum;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  roomsAvailable: number;

  @IsNotEmpty()
  @IsEnum(RoomTypeEnum)
  roomType: RoomTypeEnum;

  @IsNotEmpty()
  @IsEnum(OccupancyTypeEnum)
  occupancy: OccupancyTypeEnum;

  @IsNotEmpty()
  @IsBoolean()
  mealsIncluded: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerNight?: number;
}

export class CreatePropertyDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(PropertyType)
  type: PropertyType;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsNotEmpty()
  @IsString()
  district: string;

  @IsNotEmpty()
  @IsString()
  locality: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceAmount?: number;

  @IsNotEmpty()
  @IsEnum(PriceUnit)
  priceUnit: PriceUnit;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  contactPhone: string;

  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LandDetailDto)
  landDetail?: LandDetailDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HouseDetailDto)
  houseDetail?: HouseDetailDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BuildingDetailDto)
  buildingDetail?: BuildingDetailDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HotelDetailDto)
  hotelDetail?: HotelDetailDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenityIds?: string[];
}

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
import { AreaUnitEnum, BuildingStatusEnum, BuildingSubTypeEnum } from '../entities/building-detail.entity';
import { HotelSubTypeEnum, RoomTypeEnum } from '../entities/hotel-detail.entity';

export class LandDetailDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalArea: number;

  @IsNotEmpty()
  @IsEnum(AreaUnitEnum)
  areaUnit: AreaUnitEnum;
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
  @IsEnum(AreaUnitEnum)
  areaUnit: AreaUnitEnum;

  @IsNotEmpty()
  @IsNumber()
  floorNumber: number;

  @IsNotEmpty()
  @IsEnum(BuildingStatusEnum)
  currentStatus: BuildingStatusEnum;
}

export class HotelDetailDto {
  @IsNotEmpty()
  @IsEnum(HotelSubTypeEnum)
  subType: HotelSubTypeEnum;


  @IsNotEmpty()
  @IsEnum(RoomTypeEnum)
  roomType: RoomTypeEnum;

  @IsNotEmpty()
  @IsNumber()
  occupancy: number;

  @IsNotEmpty()
  @IsBoolean()
  mealsIncluded: boolean;

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
  @IsBoolean()
  isVerified?: boolean;

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

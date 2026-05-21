import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import {  PropertyType, TransactionType } from '../entities/property.entity';
import { FurnishingStatusEnum } from '../entities/house-detail.entity';

export class FilterPropertyDto {
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
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  bathrooms?: number;

  @IsOptional()
  @IsEnum(FurnishingStatusEnum)
  furnishingStatus?: FurnishingStatusEnum;

  @IsOptional()
  @Type(() => Number)
  minArea?: number;

  @IsOptional()
  @Type(() => Number)
  maxArea?: number;

  @IsOptional()
  @IsString()
  areaUnit?: string;

  @IsOptional()
  @IsString()
  buildingSubtype?: string;

  @IsOptional()
  @IsString()
  roomType?: string;
}

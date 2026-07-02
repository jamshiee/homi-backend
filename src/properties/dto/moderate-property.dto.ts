import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ModerationStatus } from '../entities/property.entity';

export class ModeratePropertyDto {
  @IsEnum([ModerationStatus.APPROVED, ModerationStatus.REJECTED], {
    message: 'status must be approved or rejected',
  })
  status: ModerationStatus.APPROVED | ModerationStatus.REJECTED;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

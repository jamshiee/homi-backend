import { IsOptional, IsString, MaxLength, IsIn, IsUUID } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIn(['en', 'ml'])
  preferredLanguage?: string;

  @IsOptional()
  @IsUUID()
  profileMediaId?: string;
}

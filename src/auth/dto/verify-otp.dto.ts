import { IsString, Matches, Length, IsIn, IsOptional, IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  // @IsString()
  // @Matches(/^\+[1-9]\d{9,14}$/)
  // phone: string;

  // @IsString()
  // @Length(6, 6)
  // @Matches(/^\d{6}$/, { message: 'OTP must be 6 numeric digits' })
  // otp: string;

  @IsString()
  @IsOptional()
  @IsIn(['en', 'ml'])
  preferredLanguage?: 'en' | 'ml';
}

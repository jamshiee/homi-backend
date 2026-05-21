import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^\+[1-9]\d{9,14}$/, {
    message: 'Phone must be E.164 e.g. +919876543210',
  })
  phone: string;
}

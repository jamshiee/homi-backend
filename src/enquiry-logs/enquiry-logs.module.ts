import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnquiryLog } from './enquiry-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EnquiryLog])],
  exports: [TypeOrmModule],
})
export class EnquiryLogsModule {}

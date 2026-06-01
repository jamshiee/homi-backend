import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { PropertyMedia } from './entities/property-media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { Property } from 'src/properties/entities/property.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Media, PropertyMedia,Property])],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}

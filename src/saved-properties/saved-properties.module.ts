import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedProperty } from './saved-property.entity';
import { SavedPropertiesService } from './saved-properties.service';
import { SavedPropertiesController } from './saved-properties.controller';
import { Property } from 'src/properties/entities/property.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedProperty,Property])],
  providers: [SavedPropertiesService],
  controllers: [SavedPropertiesController],
  exports: [SavedPropertiesService],
})
export class SavedPropertiesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedProperty } from './saved-property.entity';
import { SavedPropertiesService } from './saved-properties.service';
import { SavedPropertiesController } from './saved-properties.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SavedProperty])],
  providers: [SavedPropertiesService],
  controllers: [SavedPropertiesController],
  exports: [SavedPropertiesService],
})
export class SavedPropertiesModule {}

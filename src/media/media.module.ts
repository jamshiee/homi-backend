import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Media } from './entities/media.entity';
import { PropertyMedia } from './entities/property-media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { Property } from 'src/properties/entities/property.entity';
import { UsersModule } from '../users/users.module';

import { STORAGE_PROVIDER } from './providers/storage.provider.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, PropertyMedia, Property]),
    forwardRef(() => UsersModule),
  ],
  providers: [
    MediaService,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('STORAGE_PROVIDER', 'local');
        if (provider === 'r2') {
          return new R2StorageProvider(configService);
        }
        return new LocalStorageProvider(configService);
      },
    },
  ],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}

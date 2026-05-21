import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(JwtAuthGuard, AdminGuard)
export class MediaController {
  constructor(private readonly svc: MediaService) {}

  @Post('property/:propertyId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/'))
          return cb(new BadRequestException('Images only'), false);
        cb(null, true);
      },
    }),
  )
  async uploadPropertyPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Param('propertyId') propertyId: string,
    @Body('isCover') isCover: string,
    @Body('sortOrder') sortOrder: string,
  ) {
    const data = await this.svc.uploadPropertyPhoto(
      file,
      propertyId,
      isCover === 'true',
      parseInt(sortOrder ?? '0', 10) || 0,
    );
    return { data, message: 'Photo uploaded' };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.svc.deletePropertyMedia(id);
    return { data: null, message: 'Photo deleted' };
  }
}

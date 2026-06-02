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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/users.entity';
import { MediaService } from './media.service';
import { UsersService } from '../users/users.service';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly svc: MediaService,
    private readonly usersService: UsersService,
  ) {}

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
    @CurrentUser() user: User,
  ) {
    const data = await this.svc.uploadPropertyPhoto(
      file,
      propertyId,
      user.id,
      isCover === 'true',
      parseInt(sortOrder ?? '0', 10) || 0,
    );
    return { data, message: 'Photo uploaded' };
  }

  @Post('user')
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
  async uploadUserPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    const media = await this.svc.uploadUserPhoto(file, user.id);
    // Update user's profileMediaId
    await this.usersService.updateProfile(user.id, {
      profileMediaId: media.id,
    });
    return { data: media, message: 'Profile photo uploaded' };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    await this.svc.deletePropertyMedia(id, user.id);
    return { data: null, message: 'Photo deleted' };
  }
}

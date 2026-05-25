import { Controller, Post, Get, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/users.entity';
import { SavedPropertiesService } from './saved-properties.service';

@Controller('saved-properties')
@UseGuards(JwtAuthGuard)
export class SavedPropertiesController {
  constructor(private readonly svc: SavedPropertiesService) {}

  @Post('toggle')
  async toggle(@Body('propertyId') propertyId: string, @CurrentUser() user: User) {
    const result = await this.svc.toggle(user.id, propertyId);
    return {
      data: result,
      message: result.saved ? 'Property saved' : 'Property unsaved',
    };
  }

@Get(':id/saved')
async isSaved(
  @Param('id') propertyId: string,
  @CurrentUser() user: User,
) {
  const saved = await this.svc.isSaved(user.id, propertyId);

  return {
    data: {
      saved,
    },
    message: saved
      ? 'Property is saved'
      : 'Property is not saved',
  };
}

  @Get('me')
  async getMySaved(@CurrentUser() user: User) {
    return {
      data: await this.svc.findByUser(user.id),
      message: 'Saved properties',
    };
  }
}

import { Controller, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './users.entity';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return {
      data: {
        id: updated.id,
        name: updated.name,
        preferredLanguage: updated.preferredLanguage,
        profileMediaId: updated.profileMediaId,
      },
      message: 'Profile updated',
    };
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: User) {
    await this.usersService.deleteAccount(user.id);
    return {
      message: 'Account deleted successfully',
    };
  }
}

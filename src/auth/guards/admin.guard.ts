import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user as { phone?: string };
    const admins = this.config.get<string[]>('admin.numbers') || [];
    if (!user?.phone || !admins.includes(user.phone))
      throw new ForbiddenException('Admin access required.');
    return true;
  }
}

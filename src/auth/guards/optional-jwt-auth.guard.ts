import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard — attaches the user to the request if a valid token
 * is present, but never throws 401. Used on public endpoints that want to
 * personalise responses (e.g. isSaved) when the caller happens to be authed.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override handleRequest<TUser = any>(err: any, user: any, _info: any): TUser {
    return user ?? null;
  }
}

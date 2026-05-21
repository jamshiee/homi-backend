import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function keysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(keysToCamel);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        toCamel(k),
        keysToCamel(v),
      ]),
    );
  }
  return obj;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((payload: Record<string, unknown>) => ({
        success: true,
        data: keysToCamel(
          payload?.data !== undefined ? payload.data : payload,
        ),
        message: (payload?.message as string) || 'Success',
        meta: payload?.meta ? keysToCamel(payload.meta) : undefined,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

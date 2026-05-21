import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    console.log("Request URL: ", req.url);
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exRes =
      exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      typeof exRes === 'object' && exRes !== null
        ? (exRes as { message?: string | string[] }).message ||
          'Internal server error'
        : (exRes as string) || 'Internal server error';
    const code =
      typeof exRes === 'object' && exRes !== null
        ? (exRes as { error?: string }).error || 'INTERNAL_ERROR'
        : 'INTERNAL_ERROR';

    this.logger.error(
      `${req.method} ${req.url} → ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    res.status(status).json({
      success: false,
      data: null,
      message: Array.isArray(message) ? message[0] : message,
      error: {
        code: String(code).toUpperCase().replace(/ /g, '_'),
        details:
          process.env.NODE_ENV === 'development' ? message : undefined,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

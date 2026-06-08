import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /api/v1/ai/chat
   * Public endpoint — rate limited to 10 req / 60s per IP.
   */
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatDto): Promise<{ response: string }> {
    const response = await this.aiService.chat(dto.message);
    return { response };
  }
}

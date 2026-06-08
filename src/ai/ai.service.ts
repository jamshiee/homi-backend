import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { AiProvider } from './providers/ai-provider.interface';

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER';
const MAX_MESSAGE_LENGTH = 500;
const MAX_RESPONSE_LENGTH = 2000;

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly provider: AiProvider,
  ) {}

  async chat(message: string): Promise<string> {
    const trimmed = message?.trim();

    if (!trimmed) {
      throw new BadRequestException('Message must not be empty.');
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
      );
    }

    const response = await this.provider.chat(trimmed);

    // Trim response to avoid runaway long replies
    return response.length > MAX_RESPONSE_LENGTH
      ? response.slice(0, MAX_RESPONSE_LENGTH) + '…'
      : response;
  }
}

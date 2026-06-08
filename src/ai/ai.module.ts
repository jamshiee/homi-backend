import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService, AI_PROVIDER_TOKEN } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  controllers: [AiController],
  providers: [
    GeminiProvider,
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: (config: ConfigService, gemini: GeminiProvider) => {
        const provider = config.get<string>('ai.provider') ?? 'gemini';
        // Future providers: add cases here without changing AiService
        switch (provider) {
          case 'gemini':
          default:
            return gemini;
        }
      },
      inject: [ConfigService, GeminiProvider],
    },
    AiService,
  ],
})
export class AiModule {}

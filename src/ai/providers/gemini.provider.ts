import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiProvider } from './ai-provider.interface';
import { HOMI_SYSTEM_PROMPT } from '../prompts/system.prompt';

const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ai.geminiApiKey') ?? '';
  }

  async chat(message: string): Promise<string> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'AI service is not configured. Please set GEMINI_API_KEY.',
      );
    }

    try {
      const { data } = await axios.post(
        `${GEMINI_API_BASE}?key=${this.apiKey}`,
        {
          systemInstruction: {
            parts: [{ text: HOMI_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: message }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.4,
          },
        },
        {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const text: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return text.trim();
    } catch (err: any) {
      this.logger.error('Gemini API error', err?.response?.data ?? err?.message);
      throw new ServiceUnavailableException(
        'AI assistant is temporarily unavailable. Please try again later.',
      );
    }
  }
}

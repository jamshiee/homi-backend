import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { IStorageProvider } from './storage.provider.interface';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  constructor(private readonly config: ConfigService) {}

  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    _mimeType: string,
  ): Promise<string> {
    const dir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${Date.now()}-${originalFilename.replace(/\s/g, '_')}`;
    fs.writeFileSync(path.join(dir, filename), buffer);
    return `${this.config.get<string>('storage.baseUrl')}/${filename}`;
  }
}

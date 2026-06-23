import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { IStorageProvider } from './storage.provider.interface';

@Injectable()
export class R2StorageProvider implements IStorageProvider {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly logger = new Logger(R2StorageProvider.name);

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID') || "";
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID') || "";
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY') || "";
    
    this.bucketName = this.config.get<string>('R2_BUCKET_NAME') || "";
    this.publicUrl = this.config.get<string>('R2_PUBLIC_URL') || "";

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
  ): Promise<string> {
    const filename = `${Date.now()}-${originalFilename.replace(/\s/g, '_')}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
      Body: buffer,
      ContentType: mimeType,
    });

    try {
      await this.s3Client.send(command);
      // Ensure the publicUrl does not end with a slash, and filename does not start with one
      const baseUrl = this.publicUrl.endsWith('/') ? this.publicUrl.slice(0, -1) : this.publicUrl;
      return `${baseUrl}/${filename}`;
    } catch (error) {
      this.logger.error(`Failed to upload file to R2: ${error.message}`, error.stack);
      throw error;
    }
  }
}

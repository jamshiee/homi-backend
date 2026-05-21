import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

export enum OtpDeliveryChannel {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly config: ConfigService) {}

  generate(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async hash(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  async verify(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash);
  }

  async send(phone: string, otp: string): Promise<OtpDeliveryChannel> {
    if (this.config.get<boolean>('otp.terminalTest')) {
      this.logger.log(`Sending OTP to phone: ${phone} with OTP: ${otp}`);
      return OtpDeliveryChannel.SMS;
    }
    const sent = await this.sendWhatsApp(phone, otp);
    if (sent) return OtpDeliveryChannel.WHATSAPP;
    this.logger.warn(`WhatsApp OTP failed for ${phone} — falling back to SMS`);
    await this.sendSms(phone, otp);
    return OtpDeliveryChannel.SMS;
  }

  private async sendWhatsApp(phone: string, otp: string): Promise<boolean> {
    const url = this.config.get<string>('whatsapp.providerUrl');
    const apiKey = this.config.get<string>('whatsapp.apiKey');
    if (!url || !apiKey) {
      this.logger.warn('WhatsApp not configured — skipping');
      return false;
    }
    try {
      await axios.post(
        url,
        {
          phone,
          template_name: this.config.get<string>('whatsapp.templateName'),
          parameters: [{ type: 'text', text: otp }],
        },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 5000 },
      );
      return true;
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      this.logger.error(
        'WhatsApp send failed',
        ax?.response?.data ?? ax?.message ?? err,
      );
      return false;
    }
  }

  private async sendSms(phone: string, otp: string): Promise<void> {
    try {
      await axios.post(
        'https://api.msg91.com/api/v5/otp',
        {
          authkey: this.config.get<string>('msg91.authKey'),
          template_id: this.config.get<string>('msg91.templateId'),
          mobile: phone.replace('+', ''),
          otp,
          sender: this.config.get<string>('msg91.senderId'),
        },
        { timeout: 5000 },
      );
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      this.logger.error('MSG91 SMS failed', ax?.response?.data ?? ax?.message ?? err);
      throw new Error('Failed to send OTP via SMS');
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailSendPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly mode: 'smtp' | 'dev-json';
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get<string>('smtp.host') || 'smtp.serviceops.local';
    const smtpPort = this.configService.get<number>('smtp.port') || 587;
    const smtpUser = this.configService.get<string>('smtp.user');
    const smtpPass = this.configService.get<string>('smtp.pass');
    this.fromAddress =
      this.configService.get<string>('smtp.from') ||
      'ServiceOps IT Support Desk <no-reply@serviceops.local>';

    const useRealSmtp =
      process.env.SMTP_ENABLED === 'true' &&
      smtpHost !== 'smtp.serviceops.local';

    if (useRealSmtp) {
      this.mode = 'smtp';
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
      });
      this.logger.log(`MailService configured with SMTP relay ${smtpHost}:${smtpPort}`);
    } else {
      this.mode = 'dev-json';
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.logger.log('MailService running in local JSON capture transport (non-blocking dev mode)');
    }
  }

  async sendEmail(payload: EmailSendPayload): Promise<{ messageId: string; mode: 'smtp' | 'dev-json' }> {
    const info = await this.transporter.sendMail({
      from: this.fromAddress,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    if (this.mode === 'dev-json') {
      this.logger.debug(`[EMAIL:${info.messageId}] To=${payload.to} Subject="${payload.subject}"`);
    }

    return {
      messageId: info.messageId || `local-${Date.now()}`,
      mode: this.mode,
    };
  }
}


import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailSendPayload {
  to: string;
  name?: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly fallbackTransporter: Transporter;
  private readonly mode: 'brevo-api' | 'brevo-smtp' | 'smtp' | 'dev-json';
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly brevoApiKey?: string;
  private readonly brevoSmtpKey?: string;
  private readonly brevoSmtpLogin?: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.fallbackTransporter = nodemailer.createTransport({ jsonTransport: true });

    const rawKey = (
      this.configService.get<string>('BREVO_API_KEY') ||
      process.env.BREVO_API_KEY ||
      ''
    ).trim();

    this.brevoSmtpLogin = (
      this.configService.get<string>('BREVO_SMTP_LOGIN') ||
      this.configService.get<string>('BREVO_SMTP_USER') ||
      process.env.BREVO_SMTP_LOGIN ||
      process.env.BREVO_SMTP_USER ||
      this.configService.get<string>('BREVO_SENDER_EMAIL') ||
      process.env.BREVO_SENDER_EMAIL ||
      ''
    ).trim();

    this.brevoSmtpKey = (
      this.configService.get<string>('BREVO_SMTP_KEY') ||
      process.env.BREVO_SMTP_KEY ||
      (rawKey.startsWith('xsmtpsib-') ? rawKey : '')
    ).trim();

    // If raw key starts with xkeysib- or is a general API key, treat as REST API key
    if (rawKey && !rawKey.startsWith('xsmtpsib-')) {
      this.brevoApiKey = rawKey;
    } else {
      this.brevoApiKey = undefined;
    }

    this.fromEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') ||
      process.env.BREVO_SENDER_EMAIL ||
      this.configService.get<string>('smtp.from') ||
      'supportserviceops@gmail.com';

    this.fromName =
      this.configService.get<string>('BREVO_SENDER_NAME') ||
      process.env.BREVO_SENDER_NAME ||
      'ServiceOps IT Support Desk';

    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';

    if (this.brevoApiKey) {
      this.mode = 'brevo-api';
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.logger.log(`MailService configured with Brevo REST API (xkeysib key).`);
    } else if (this.brevoSmtpKey && this.brevoSmtpLogin) {
      this.mode = 'brevo-smtp';
      this.transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: { user: this.brevoSmtpLogin, pass: this.brevoSmtpKey },
      });
      this.logger.log(
        `MailService configured with Brevo SMTP Relay (smtp-relay.brevo.com:587) for login: ${this.brevoSmtpLogin}`,
      );
    } else {
      this.mode = 'dev-json';
      this.transporter = this.fallbackTransporter;
      this.logger.log(
        'MailService active in local simulation / dev-json capture mode.',
      );
    }
  }

  /**
   * Dispatches an email using Brevo REST API, Brevo SMTP, or local development transport.
   */
  async sendEmail(
    payload: EmailSendPayload,
  ): Promise<{ messageId: string; mode: string }> {
    // 1. Primary Brevo REST API Dispatch (for xkeysib keys)
    if (this.brevoApiKey && this.brevoApiKey.trim().length > 0) {
      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': this.brevoApiKey.trim(),
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: this.fromName,
              email: this.fromEmail,
            },
            to: [
              {
                email: payload.to,
                name: payload.name || payload.to.split('@')[0],
              },
            ],
            subject: payload.subject,
            htmlContent:
              payload.html ||
              `<div style="font-family:sans-serif;line-height:1.6;color:#1c1915;">${payload.text.replace(/\n/g, '<br/>')}</div>`,
            textContent: payload.text,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as { messageId?: string };
          const messageId = data.messageId || `brevo-${Date.now()}`;
          this.logger.log(
            `[BREVO EMAIL SENT via API] messageId=${messageId} to=${payload.to} subject="${payload.subject}"`,
          );
          return { messageId, mode: 'brevo-api' };
        } else {
          const errText = await res.text();
          this.logger.warn(
            `[BREVO API ERROR] (${res.status}): ${errText}`,
          );
          if (errText.includes('unrecognised IP address') || errText.includes('authorised_ips')) {
            this.logger.warn(
              `⚠️ [BREVO ACTION REQUIRED] Brevo blocked this email because 'Authorized IPs' is turned ON in your Brevo account. Open: https://app.brevo.com/security/authorised_ips to add your IP or disable IP restrictions.`,
            );
          }
        }
      } catch (err: any) {
        this.logger.warn(`[BREVO API EXCEPTION] ${err?.message} — attempting SMTP relay if configured`);
      }
    }

    // 2. Brevo SMTP Relay Dispatch (for xsmtpsib keys)
    if (this.brevoSmtpKey && this.brevoSmtpLogin) {
      try {
        const smtpTransport =
          this.mode === 'brevo-smtp'
            ? this.transporter
            : nodemailer.createTransport({
              host: 'smtp-relay.brevo.com',
              port: 587,
              secure: false,
              auth: { user: this.brevoSmtpLogin, pass: this.brevoSmtpKey },
            });

        const info = await smtpTransport.sendMail({
          from: `"${this.fromName}" <${this.fromEmail}>`,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        });
        this.logger.log(
          `[BREVO EMAIL SENT via SMTP] messageId=${info.messageId} to=${payload.to} subject="${payload.subject}"`,
        );
        return { messageId: info.messageId, mode: 'brevo-smtp' };
      } catch (err: any) {
        this.logger.warn(
          `[BREVO SMTP FAILED] ${err?.message}. Note: Brevo requires the specific SMTP Login username shown in Brevo Dashboard -> Settings -> SMTP & API -> SMTP. Ensure BREVO_SMTP_LOGIN is set in backend/.env.`,
        );
      }
    }

    // 3. Fallback Local Development Transport (Safe In-Memory Capture, Never Throws)
    try {
      const info = await this.fallbackTransporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });

      this.logger.log(
        `\n================= [CAPTURED EMAIL DISPATCH] =================\n` +
        `To: ${payload.to}\n` +
        `Subject: ${payload.subject}\n` +
        `Body:\n${payload.text}\n` +
        `=============================================================\n`,
      );

      return {
        messageId: info.messageId || `dev-${Date.now()}`,
        mode: 'dev-json',
      };
    } catch (fallbackErr: any) {
      this.logger.warn(`Fallback email capture error: ${fallbackErr?.message}`);
      return {
        messageId: `err-${Date.now()}`,
        mode: 'error',
      };
    }
  }

  /**
   * Helper: Standard ServiceOps HTML Email Layout wrapper
   */
  private wrapEmailHtml(title: string, bodyContent: string, actionButton?: { text: string; url: string }): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f7f3eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1915; }
    .container { max-width: 580px; margin: 32px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e4ddd2; overflow: hidden; box-shadow: 0 4px 20px rgba(28, 25, 21, 0.06); }
    .header { background: #07203f; padding: 22px 32px; border-bottom: 2px solid #1a3c68; }
    .brand-name { color: #f4efe6; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; vertical-align: middle; }
    .content { padding: 32px; }
    h1 { font-size: 22px; font-weight: 600; color: #1c1915; margin: 0 0 16px; line-height: 1.3; }
    p { font-size: 15px; line-height: 1.6; color: #4a453e; margin: 0 0 16px; }
    .btn { display: inline-block; background: #8e3f1e; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; margin: 18px 0; }
    .token-box { background: #fbf9f4; border: 1px dashed #d4cdc1; border-radius: 8px; padding: 12px 16px; font-family: monospace; font-size: 15px; color: #8e3f1e; word-break: break-all; margin: 16px 0; }
    .footer { padding: 20px 32px; background: #fbf9f4; border-top: 1px solid #e4ddd2; font-size: 12px; color: #6f685e; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${this.frontendUrl}/logo.png" width="26" height="26" style="vertical-align: middle; border-radius: 6px; margin-right: 10px;" alt="ServiceOps" />
      <span class="brand-name">ServiceOps · Enterprise IT Operations</span>
    </div>
    <div class="content">
      <h1>${title}</h1>
      ${bodyContent}
      ${actionButton
        ? `<div style="text-align: center; margin: 24px 0;"><a href="${actionButton.url}" class="btn" target="_blank">${actionButton.text} &rarr;</a></div>`
        : ''
      }
    </div>
    <div class="footer">
      Colombo Office · Secure Platform Messaging
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Password Reset Email with clickable link and 6-digit verification code.
   */
  async sendPasswordResetEmail(to: string, recipientName: string, resetCode: string) {
    const resetUrl = `${this.frontendUrl}/login?mode=reset&code=${encodeURIComponent(resetCode)}&email=${encodeURIComponent(to)}`;
    const subject = 'ServiceOps — Password Reset Verification Code';
    const text = `Hello ${recipientName},\n\nA password reset was requested for your account (${to}).\n\nYour 6-digit verification code is:\n\n${resetCode}\n\nEnter this code on the password reset screen or click the link below:\n${resetUrl}\n\nThis verification code will expire in 30 minutes. If you did not request this, please disregard this email.`;

    const html = this.wrapEmailHtml(
      'Password Reset Verification Code',
      `<p>Hello <strong>${recipientName}</strong>,</p>
       <p>We received a request to reset the password for your ServiceOps account (<code>${to}</code>).</p>
       <p>Use the 6-digit verification code below to set a new password:</p>
       <div style="background: #fbf9f4; border: 2px dashed #8e3f1e; border-radius: 10px; padding: 20px 24px; text-align: center; margin: 24px 0;">
         <span style="font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #6f685e; display: block; margin-bottom: 8px;">6-Digit Verification Code</span>
         <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #8e3f1e;">${resetCode}</span>
       </div>
       <p>This verification code is valid for <strong>30 minutes</strong>.</p>
       <p style="font-size: 13px; color: #6f685e;">If you did not request a password reset, no action is required and your account remains secure.</p>`,
      { text: 'Verify Code & Reset Password', url: resetUrl },
    );

    return this.sendEmail({ to, name: recipientName, subject, text, html });
  }

  /**
   * Employee Account Registration Received (Pending Administrator Approval).
   */
  async sendRegistrationPendingEmail(to: string, recipientName: string) {
    const subject = 'ServiceOps — Employee Account Registration Received';
    const text = `Hello ${recipientName},\n\nThank you for registering your employee account at ServiceOps (${to}).\n\nYour registration has been submitted and is currently pending System Administrator review and approval.\n\nYou will receive a follow-up email once an administrator approves your account, after which you will be able to log in.\n\n— ServiceOps IT Desk`;

    const html = this.wrapEmailHtml(
      'Registration Received (Pending Approval)',
      `<p>Hello <strong>${recipientName}</strong>,</p>
       <p>Thank you for creating an employee account on the <strong>ServiceOps</strong> IT Management Platform.</p>
       <div style="background: #f8efd8; border-left: 4px solid #8a5a10; padding: 14px 18px; border-radius: 4px; margin: 18px 0;">
         <strong style="color: #8a5a10; display: block; margin-bottom: 4px;">Approval Required</strong>
         <span style="font-size: 13.5px; color: #4a453e;">In accordance with enterprise security policy, your employee account requires approval from a <strong>System Administrator</strong> before you can log in.</span>
       </div>
       <p>You will receive an automated confirmation email as soon as an administrator reviews and approves your account.</p>`,
    );

    return this.sendEmail({ to, name: recipientName, subject, text, html });
  }

  /**
   * Alert to System Administrators when a new employee account is pending approval.
   */
  async sendRegistrationAdminAlertEmail(
    adminEmails: string[],
    employee: { firstName: string; lastName: string; email: string; department?: string },
  ) {
    if (!adminEmails || adminEmails.length === 0) return;
    const approvalUrl = `${this.frontendUrl}/dashboard`;
    const subject = `[Action Required] New Account Registration Pending Approval — ${employee.firstName} ${employee.lastName}`;
    const text = `Administrator Alert,\n\nA new employee account has registered and is pending your approval:\n\nName: ${employee.firstName} ${employee.lastName}\nEmail: ${employee.email}\nDepartment: ${employee.department || 'Not specified'}\n\nPlease review and approve the user in the Accounts and Roles view:\n${approvalUrl}`;

    const html = this.wrapEmailHtml(
      'New Account Pending Approval',
      `<p>A new employee account has registered and is awaiting administrator approval before login access is granted:</p>
       <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
         <tr><td style="padding: 6px 0; color: #6f685e; width: 120px;">Name:</td><td><strong>${employee.firstName} ${employee.lastName}</strong></td></tr>
         <tr><td style="padding: 6px 0; color: #6f685e;">Email:</td><td><code>${employee.email}</code></td></tr>
         <tr><td style="padding: 6px 0; color: #6f685e;">Department:</td><td>${employee.department || 'General Operations'}</td></tr>
         <tr><td style="padding: 6px 0; color: #6f685e;">Role:</td><td><span style="background: #e5f0ea; color: #1f5c40; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">EMPLOYEE</span></td></tr>
       </table>
       <p>You can approve or reject this request in the <strong>Accounts and Roles</strong> desk.</p>`,
      { text: 'Review in People & Roles', url: approvalUrl },
    );

    // Send to each admin
    for (const adminEmail of adminEmails) {
      await this.sendEmail({ to: adminEmail, subject, text, html });
    }
  }

  /**
   * Account Approved Email to employee when System Admin activates their account.
   */
  async sendAccountApprovedEmail(to: string, recipientName: string) {
    const loginUrl = `${this.frontendUrl}/login`;
    const subject = 'ServiceOps — Your Account Has Been Approved!';
    const text = `Hello ${recipientName},\n\nGreat news! Your ServiceOps employee account (${to}) has been approved by a System Administrator.\n\nYou can now sign in using your corporate email and password:\n${loginUrl}\n\n— ServiceOps IT Desk`;

    const html = this.wrapEmailHtml(
      'Your Account Has Been Approved!',
      `<p>Hello <strong>${recipientName}</strong>,</p>
       <div style="background: #e5f0ea; border-left: 4px solid #1f5c40; padding: 14px 18px; border-radius: 4px; margin: 18px 0;">
         <strong style="color: #1f5c40; display: block; margin-bottom: 4px;">Access Activated</strong>
         <span style="font-size: 13.5px; color: #4a453e;">A System Administrator has reviewed and approved your employee account. You now have full access to the IT Service Desk.</span>
       </div>
       <p>You can sign in immediately using your email (<code>${to}</code>) and the password you selected during registration.</p>`,
      { text: 'Sign In to ServiceOps', url: loginUrl },
    );

    return this.sendEmail({ to, name: recipientName, subject, text, html });
  }

  /**
   * Operational Notification Email (Tickets, SLA, Major Incidents).
   */
  async sendOperationalNotificationEmail(
    to: string,
    recipientName: string,
    title: string,
    message: string,
    linkUrl?: string,
  ) {
    const fullUrl = linkUrl ? `${this.frontendUrl}${linkUrl.startsWith('/') ? '' : '/'}${linkUrl}` : `${this.frontendUrl}/dashboard`;
    const subject = `[ServiceOps] ${title}`;
    const text = `Hello ${recipientName},\n\n${title}\n\n${message}\n\nView details: ${fullUrl}\n\n— ServiceOps Enterprise ITSM`;

    const html = this.wrapEmailHtml(
      title,
      `<p>Hello <strong>${recipientName}</strong>,</p>
       <p>${message}</p>`,
      { text: 'View in Service Desk', url: fullUrl },
    );

    return this.sendEmail({ to, name: recipientName, subject, text, html });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  async sendOtpEmail(email: string, otp: string) {
    const subject = 'Your Profytron Verification Code';
    const html = `
      <div style="background: #020617; color: white; padding: 40px; font-family: sans-serif; border-radius: 12px;">
        <h1 style="color: #6366f1;">PROFYTRON</h1>
        <p>Your institutional verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1; padding: 20px; background: #0f172a; display: inline-block; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes.</p>
      </div>
    `;

    return this.send(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const subject = 'Reset Your Profytron Password';
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <div style="background: #020617; color: white; padding: 40px; font-family: sans-serif;">
        <h1 style="color: #6366f1;">PROFYTRON</h1>
        <p>Click the button below to reset your secure access:</p>
        <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
    `;

    return this.send(email, subject, html);
  }

  private async send(to: string, subject: string, html: string) {
    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: 'Profytron <no-reply@profytron.com>',
          to,
          subject,
          html,
        });
        return true;
      } catch (err) {
        this.logger.error(`Failed to send via Resend: ${err.message}`);
      }
    }

    this.logger.warn(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return true;
  }
}


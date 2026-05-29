import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

const BASE = `
  <div style="background:#020617;color:#e2e8f0;padding:40px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;border-radius:16px;">
    <div style="margin-bottom:28px;">
      <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">PROFYTRON</span>
    </div>
`;
const FOOTER = `
    <hr style="border:none;border-top:1px solid #1e293b;margin:28px 0;" />
    <p style="font-size:11px;color:#475569;margin:0;">This email was sent by Profytron · <a href="https://profytron.com" style="color:#6366f1;text-decoration:none;">profytron.com</a></p>
  </div>
`;

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
    const html = `${BASE}
      <p style="color:#94a3b8;margin:0 0 20px;">Your verification code is:</p>
      <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#6366f1;padding:20px 28px;background:#0f172a;display:inline-block;border-radius:12px;border:1px solid #1e293b;">${otp}</div>
      <p style="color:#64748b;font-size:13px;margin-top:20px;">Expires in <strong>10 minutes</strong>. Do not share this code.</p>
    ${FOOTER}`;
    return this.send(email, 'Your Profytron Verification Code', html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `${BASE}
      <p style="font-size:20px;font-weight:700;margin:0 0 12px;">Reset your password</p>
      <p style="color:#94a3b8;margin:0 0 24px;">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a href="${url}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;">Reset Password</a>
      <p style="color:#475569;font-size:12px;margin-top:20px;">If you didn't request this, ignore this email.</p>
    ${FOOTER}`;
    return this.send(email, 'Reset Your Profytron Password', html);
  }

  async sendWelcomeEmail(email: string, name: string) {
    const html = `${BASE}
      <p style="font-size:22px;font-weight:700;margin:0 0 12px;">Welcome, ${name} 🎯</p>
      <p style="color:#94a3b8;margin:0 0 20px;">Your account is verified and ready. You now have access to:</p>
      <ul style="color:#cbd5e1;padding-left:20px;line-height:1.9;">
        <li>Copy trading from verified strategy creators</li>
        <li>AI-powered trade coaching and analytics</li>
        <li>Real-time signals and risk management</li>
        <li>Strategy marketplace and affiliate earnings</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}/dashboard" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;margin-top:20px;">Go to Dashboard</a>
    ${FOOTER}`;
    return this.send(email, `Welcome to Profytron, ${name}!`, html);
  }

  async sendMagicLinkEmail(email: string, name: string, link: string) {
    const html = `${BASE}
      <p style="font-size:20px;font-weight:700;margin:0 0 12px;">Your login link</p>
      <p style="color:#94a3b8;margin:0 0 24px;">Hi ${name || 'Trader'}, click below to sign in to Profytron. This link expires in <strong>15 minutes</strong>.</p>
      <a href="${link}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;">Sign In Securely</a>
      <p style="color:#475569;font-size:12px;margin-top:20px;">If you didn't request this, ignore this email.</p>
    ${FOOTER}`;
    return this.send(email, 'Your Profytron Magic Login Link', html);
  }

  async sendTradeAlertEmail(
    email: string,
    name: string,
    data: {
      alertType:
        | 'TRADE_OPENED'
        | 'TRADE_CLOSED'
        | 'TP_HIT'
        | 'SL_HIT'
        | 'MARGIN_WARNING';
      symbol: string;
      direction: string;
      price?: number;
      pnl?: number;
      strategyName?: string;
    },
  ) {
    const labels: Record<string, { title: string; color: string }> = {
      TRADE_OPENED: { title: 'Trade Opened', color: '#22d3ee' },
      TRADE_CLOSED: { title: 'Trade Closed', color: '#a78bfa' },
      TP_HIT: { title: '✅ Take Profit Hit', color: '#4ade80' },
      SL_HIT: { title: '🛑 Stop Loss Hit', color: '#f87171' },
      MARGIN_WARNING: { title: '⚠️ Margin Warning', color: '#fb923c' },
    };
    const { title, color } = labels[data.alertType] ?? {
      title: data.alertType,
      color: '#6366f1',
    };
    const pnlText =
      data.pnl !== undefined
        ? `<p style="font-size:18px;font-weight:700;color:${data.pnl >= 0 ? '#4ade80' : '#f87171'};">P&L: ${data.pnl >= 0 ? '+' : ''}${data.pnl?.toFixed(2)} USD</p>`
        : '';

    const html = `${BASE}
      <p style="font-size:18px;font-weight:700;color:${color};margin:0 0 8px;">${title}</p>
      <p style="color:#94a3b8;margin:0 0 16px;">Hi ${name || 'Trader'}, here's your trade update.</p>
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:16px;">
        <p style="margin:0 0 8px;"><span style="color:#64748b;">Symbol:</span> <strong>${data.symbol}</strong></p>
        <p style="margin:0 0 8px;"><span style="color:#64748b;">Direction:</span> <strong>${data.direction}</strong></p>
        ${data.price ? `<p style="margin:0 0 8px;"><span style="color:#64748b;">Price:</span> <strong>${data.price}</strong></p>` : ''}
        ${data.strategyName ? `<p style="margin:0;"><span style="color:#64748b;">Strategy:</span> <strong>${data.strategyName}</strong></p>` : ''}
      </div>
      ${pnlText}
      <a href="${process.env.FRONTEND_URL}/dashboard" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;">View Dashboard</a>
    ${FOOTER}`;
    return this.send(email, `Profytron Alert: ${title} — ${data.symbol}`, html);
  }

  async sendPaymentEmail(
    email: string,
    name: string,
    data: {
      type: 'SUCCESS' | 'FAILED';
      amount: number;
      currency?: string;
      description?: string;
    },
  ) {
    const success = data.type === 'SUCCESS';
    const html = `${BASE}
      <p style="font-size:20px;font-weight:700;color:${success ? '#4ade80' : '#f87171'};margin:0 0 12px;">${success ? '✅ Payment Successful' : '❌ Payment Failed'}</p>
      <p style="color:#94a3b8;margin:0 0 20px;">Hi ${name || 'Trader'}, ${success ? 'your payment was processed successfully.' : 'your payment could not be processed. Please try again.'}</p>
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;">
        <p style="margin:0 0 8px;"><span style="color:#64748b;">Amount:</span> <strong>${data.currency ?? 'USD'} ${data.amount.toFixed(2)}</strong></p>
        ${data.description ? `<p style="margin:0;"><span style="color:#64748b;">For:</span> <strong>${data.description}</strong></p>` : ''}
      </div>
      <a href="${process.env.FRONTEND_URL}/wallet" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;margin-top:20px;">View Wallet</a>
    ${FOOTER}`;
    return this.send(
      email,
      `Profytron: Payment ${success ? 'Confirmed' : 'Failed'}`,
      html,
    );
  }

  async sendSubscriptionExpiredEmail(
    email: string,
    name: string,
    strategyName: string,
  ) {
    const html = `${BASE}
      <p style="font-size:20px;font-weight:700;margin:0 0 12px;">Subscription Expired</p>
      <p style="color:#94a3b8;margin:0 0 20px;">Hi ${name || 'Trader'}, your subscription to <strong>${strategyName}</strong> has expired. Renew to continue copy trading.</p>
      <a href="${process.env.FRONTEND_URL}/marketplace" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;">Renew Subscription</a>
    ${FOOTER}`;
    return this.send(
      email,
      `Your Profytron subscription to ${strategyName} has expired`,
      html,
    );
  }

  async sendKycStatusEmail(
    email: string,
    name: string,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string,
  ) {
    const approved = status === 'VERIFIED';
    const html = `${BASE}
      <p style="font-size:20px;font-weight:700;color:${approved ? '#4ade80' : '#f87171'};margin:0 0 12px;">${approved ? '✅ KYC Verified' : '❌ KYC Rejected'}</p>
      <p style="color:#94a3b8;margin:0 0 16px;">Hi ${name || 'Trader'}, ${approved ? 'your identity has been verified. You can now make withdrawals.' : 'your KYC documents were not accepted.'}</p>
      ${notes ? `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;margin-bottom:16px;"><p style="color:#94a3b8;margin:0;">${notes}</p></div>` : ''}
      <a href="${process.env.FRONTEND_URL}/settings/kyc" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;">${approved ? 'Go to Wallet' : 'Resubmit Documents'}</a>
    ${FOOTER}`;
    return this.send(
      email,
      `Profytron KYC: ${approved ? 'Verified' : 'Action Required'}`,
      html,
    );
  }

  async sendNotificationEmail(
    email: string,
    name: string,
    title: string,
    message: string,
    actionUrl?: string,
  ) {
    const cta = actionUrl
      ? `<a href="${actionUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;margin-top:16px;">Open Alert</a>`
      : '';
    const html = `${BASE}
      <p style="font-size:18px;font-weight:700;margin:0 0 8px;">${title}</p>
      <p style="color:#94a3b8;margin:0 0 4px;">Hi ${name || 'Trader'},</p>
      <p style="color:#cbd5e1;margin:0 0 16px;">${message}</p>
      ${cta}
    ${FOOTER}`;
    return this.send(email, `Profytron Alert: ${title}`, html);
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
        this.logger.error(
          `Failed to send via Resend: ${(err as Error).message}`,
        );
      }
    }
    this.logger.warn(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return true;
  }
}

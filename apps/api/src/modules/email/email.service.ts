import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendOtpEmail(email: string, otp: string) {
    this.logger.log(`Mock Email -> To: ${email} | Subject: Verification Code | OTP: ${otp}`);
    return true;
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    this.logger.log(`Mock Email -> To: ${email} | Subject: Password Reset | Token: ${resetToken}`);
    return true;
  }
}

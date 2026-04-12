import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const rawKey =
      process.env.AES_MASTER_KEY || 'default_key_32_characters_long_!';
    // Must be exactly 32 bytes for aes-256
    this.key = Buffer.from(rawKey.padEnd(32).slice(0, 32), 'utf-8');
  }

  encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      return JSON.stringify({
        iv: iv.toString('hex'),
        encrypted,
        authTag,
      });
    } catch (e) {
      throw new InternalServerErrorException('Encryption failed');
    }
  }

  decrypt(storedData: string): string {
    try {
      const parsed = JSON.parse(storedData);
      const iv = Buffer.from(parsed.iv, 'hex');
      const authTag = Buffer.from(parsed.authTag, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(parsed.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (e) {
      throw new InternalServerErrorException('Decryption failed');
    }
  }
}

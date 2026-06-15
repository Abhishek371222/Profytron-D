import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const rawKey = process.env.AES_MASTER_KEY;
    if (!rawKey) {
      throw new Error('AES_MASTER_KEY env var is required — generate one with: node -e "require(\'crypto\').randomBytes(32).toString(\'hex\')|0"');
    }
    const keyBytes = Buffer.from(rawKey, 'hex');
    if (keyBytes.length !== 32) {
      throw new Error(`AES_MASTER_KEY must be exactly 32 bytes (64 hex chars). Got ${keyBytes.length} bytes.`);
    }
    this.key = keyBytes;
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

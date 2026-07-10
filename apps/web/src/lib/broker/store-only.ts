import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export function jsonOk(data: unknown, status = 200) {
  return Response.json(
    { success: status < 400, data, timestamp: new Date().toISOString() },
    { status },
  );
}

export function jsonError(message: string, status = 400) {
  return Response.json(
    {
      success: false,
      statusCode: status,
      error: message,
      message,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export function encryptAesGcm(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('AES_MASTER_KEY must be 64 hex chars');
  }
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag,
  });
}

export function decryptAesGcm(storedData: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const parsed = JSON.parse(storedData);
  const iv = Buffer.from(parsed.iv, 'hex');
  const authTag = Buffer.from(parsed.authTag, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(parsed.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function mintBridgeToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashBridgeToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function userIdFromRequest(
  req: NextRequest,
): Promise<string | null> {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const backend = (
    process.env.BACKEND_API_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://profytron-api.onrender.com'
  ).replace(/\/$/, '');

  if (bearer) {
    try {
      const meRes = await fetch(`${backend}/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${bearer}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        cache: 'no-store',
      });
      if (meRes.ok) {
        const body = (await meRes.json()) as any;
        const data = body?.data ?? body;
        const id = data?.id ?? data?.userId;
        if (typeof id === 'string' && id.length > 0) return id;
      }
    } catch {
      /* fall through */
    }
  }

  if (!bearer) return null;
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(
      bearer,
      new TextEncoder().encode(secret),
      { algorithms: ['HS256'] },
    );
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

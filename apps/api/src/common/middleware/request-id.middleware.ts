import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
      correlationId?: string;
    }
  }
}

/**
 * Assigns / echoes request + correlation IDs for logs, errors, and Sentry.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incomingRequestId = String(
    req.headers[REQUEST_ID_HEADER] ?? '',
  ).trim();
  const incomingCorrelationId = String(
    req.headers[CORRELATION_ID_HEADER] ?? '',
  ).trim();

  const requestId =
    incomingRequestId && incomingRequestId.length <= 128
      ? incomingRequestId
      : randomUUID();
  const correlationId =
    incomingCorrelationId && incomingCorrelationId.length <= 128
      ? incomingCorrelationId
      : requestId;

  req.requestId = requestId;
  req.correlationId = correlationId;

  res.setHeader(REQUEST_ID_HEADER, requestId);
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  next();
}

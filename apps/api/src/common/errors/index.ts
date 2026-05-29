import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.enum';

export { ErrorCode };

/**
 * Throws a structured HTTP exception compatible with AllExceptionsFilter.
 * Response body: { success: false, statusCode, error: message, code, timestamp, path }
 */
export function appError(
  status: HttpStatus,
  message: string,
  code: ErrorCode,
): never {
  throw new HttpException({ message, code }, status);
}

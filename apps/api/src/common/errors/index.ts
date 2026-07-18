import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.enum';

export { ErrorCode };

export function appError(
  status: HttpStatus,
  message: string,
  code: ErrorCode,
): never {
  throw new HttpException({ message, code }, status);
}

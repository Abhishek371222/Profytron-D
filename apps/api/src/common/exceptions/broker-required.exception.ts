import { HttpException, HttpStatus } from '@nestjs/common';

/** Returned when a user must connect MT5 before subscribing to a bot. */
export class BrokerRequiredException extends HttpException {
  constructor(
    message = 'Connect your MT5 trading account before subscribing to this bot.',
  ) {
    super(
      {
        code: 'BROKER_REQUIRED',
        message,
        statusCode: HttpStatus.PRECONDITION_REQUIRED,
      },
      HttpStatus.PRECONDITION_REQUIRED,
    );
  }
}

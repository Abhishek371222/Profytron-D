import { HttpException, HttpStatus } from '@nestjs/common';

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

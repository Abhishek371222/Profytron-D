import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

const isProd =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
const enableFileLogs =
  process.env.LOG_TO_FILE === 'true' ||
  (!isProd && process.env.LOG_TO_FILE !== 'false');

const consoleFormat = isProd
  ? winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    )
  : winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      nestWinstonModuleUtilities.format.nestLike('Profytron', {
        colors: true,
        prettyPrint: true,
      }),
    );

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  }),
];

if (enableFileLogs) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );
}

export const winstonConfig = {
  transports,
};

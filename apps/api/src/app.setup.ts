import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

const JSON_BODY_LIMIT = '100kb';
const URLENCODED_BODY_LIMIT = '100kb';

export function configureApp(app: INestApplication) {
  const isProduction = process.env.NODE_ENV === 'production';

  const expressInstance = app.getHttpAdapter().getInstance();
  if (expressInstance?.set) {
    expressInstance.set('trust proxy', 1);
  }

  app.use(
    compression({
      threshold: 1024,
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    }),
  );

  const allowedOrigins = (
    process.env.CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    ''
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const extraConnectSrc = (process.env.CONNECT_SRC_EXTRA || '')
    .split(' ')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use('/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.use('/v1/webhooks/razorpay', express.raw({ type: 'application/json' }));
  app.use('/v1/wallet/webhook', express.raw({ type: 'application/json' }));

  app.use(
    express.json({
      limit: JSON_BODY_LIMIT,
      strict: false,
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: URLENCODED_BODY_LIMIT }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const MAX_BYTES = 200 * 1024;
    if (contentLength > MAX_BYTES) {
      res.status(413).json({ success: false, error: 'Payload too large' });
      return;
    }
    next();
  });

  app.setGlobalPrefix('v1', {
    exclude: [{ path: 'health', method: RequestMethod.ALL }],
  });

  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (
      req.method === 'GET' &&
      (req.url === '/v1/health' || req.url?.startsWith('/v1/health?'))
    ) {
      req.url = req.url.replace('/v1/health', '/health');
    }
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", ...extraConnectSrc],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: false }
        : false,
      xContentTypeOptions: true,
      xDnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin(
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      if (!requestOrigin) return callback(null, true);
      if (allowedOrigins.includes(requestOrigin)) return callback(null, true);
      callback(new Error(`CORS: origin '${requestOrigin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: [],
  });

  app.useGlobalFilters(
    new AllExceptionsFilter({ httpAdapter: app.getHttpAdapter() } as any),
  );
  app.useGlobalInterceptors(
    new SentryInterceptor(),
    new TransformInterceptor(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Profytron API')
      .setDescription('Complete Profytron backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }
}

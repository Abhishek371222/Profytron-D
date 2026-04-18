import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as net from 'node:net';
import { AppModule } from './app.module';
import { winstonConfig } from './config/winston.config';
import { configureApp } from './app.setup';

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (error: NodeJS.ErrnoException) => {
      resolve(error.code === 'EADDRINUSE');
    });
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, '0.0.0.0');
  });
}

async function resolveApiPort(requestedPort: number): Promise<number> {
  const maxPortChecks = 20;
  let port = requestedPort;
  for (let i = 0; i < maxPortChecks; i += 1) {
    if (!(await isPortInUse(port))) {
      return port;
    }
    port += 1;
  }
  return requestedPort;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: WinstonModule.createLogger(winstonConfig),
  });

  configureApp(app);

  const requestedPort = Number(process.env.API_PORT || 4000);
  const port = await resolveApiPort(requestedPort);
  if (port !== requestedPort) {
    console.warn(
      `[Profytron] Port ${requestedPort} is busy, falling back to ${port}.`,
    );
  }

  await app.listen(port);
  console.log(`[Profytron] API is running on: http://localhost:${port}`);
  console.log(`[Profytron] Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { configureApp } from '../app.setup';

export async function createTestApp(): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
}> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication({
    bodyParser: false,
  });
  configureApp(app);
  await app.init();

  return { app, moduleFixture };
}

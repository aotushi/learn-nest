import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // const app = await NestFactory.create(AppModule);
  app.useStaticAssets('public', { prefix: '/static' });

  app.enableCors({
    origin: ['http://172.25.160.1:8083'],
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();

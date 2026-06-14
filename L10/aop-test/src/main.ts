import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';
import { LoginGuard } from './login.guard';
import { TimeInterceptor } from './time.interceptor';
import { TestFilter } from './test.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // middleware 全局级别
  app.use(function (req: Request, res: Response, next: NextFunction) {
    console.log('before>req.url', req.url);
    next();
    console.log('after');
  });

  // Guard全局级别
  // app.useGlobalGuards(new LoginGuard());

  // Interceptor全局级别(共计3种, 全局/controller/路由)
  app.useGlobalInterceptors(new TimeInterceptor());

  // filter 全局用法
  // app.useGlobalFilters(new TestFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

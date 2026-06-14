import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogMiddleware } from './log.middleware';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoginGuard } from './login.guard';
import { TestFilter } from './test.filter';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: LoginGuard,
    // },
    // filter全局用法
    {
      provide: APP_FILTER,
      useClass: TestFilter,
    },
  ],
})

// middleware 路由级别: 注册中间件
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 此处有版本性的差异, 教程是旧版用法'aaa*'
    consumer.apply(LogMiddleware).forRoutes('aaa{/*path}');
  }
}

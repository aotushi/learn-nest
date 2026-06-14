import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
// middleware 路由级别
export class LogMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    console.log('before2', req.url);
    next();
    console.log('after2');
  }
}

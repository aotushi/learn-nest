import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class AaaGuard implements CanActivate {
  constructor(@Inject() private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // console.log('context', context);
    // getHandler 返回当前正在执行的路由处理函数（Route Handler） 目前就是controller上的getHello
    console.log(
      'reflector handler',
      this.reflector.get('aaa', context.getHandler()),
    );
    return true;
  }
}

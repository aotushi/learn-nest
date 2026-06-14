import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from './app.service';

@Injectable()
export class LoginGuard implements CanActivate {
  // 属性注入和构造函数注入
  // @Inject(AppService)
  // private readonly appService: AppService;

  constructor(private readonly appService: AppService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    console.log('login check', this.appService.getHello());
    return false;
  }
}

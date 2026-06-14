import { Controller, Get, SetMetadata, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AaaGuard } from './aaa.guard';
import { Aaa } from './aaa.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  // 装饰器将aaa-admin添加到方法getHello上, 元数据是被隐藏地存储在函数的元数据仓库（Reflect Metadata）中的，你无法直接通过常规属性访问到。必须使用 Reflector 服务（或底层 Reflect API）来读取：
  @SetMetadata('aaa', 'admin')
  @UseGuards(AaaGuard)
  getHello(): string {
    return this.appService.getHello();
  }

  // 上面的setMetadata繁琐, 方式2更精简. 创建装饰器aaa
  @Get('2')
  @Aaa('admin')
  @UseGuards(AaaGuard)
  getHello2() {
    return this.appService.getHello();
  }
}

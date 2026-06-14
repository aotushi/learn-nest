import { Controller, Get, UseGuards, UseInterceptors, Query, UseFilters } from '@nestjs/common';
import { AppService } from './app.service';
import { LoginGuard } from './login.guard';
import { TimeInterceptor } from './time.interceptor';
import { ValidatePipe } from './validate.pipe';
import { TestFilter } from './test.filter';

@Controller()
@UseInterceptors(TimeInterceptor)
// @UseFilters(TestFilter)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    console.log('handler....');
    return this.appService.getHello();
  }

  @Get('aaa')
  // @UseGuards(LoginGuard)
  aaa(): string {
    console.log('aaa...');
    return 'aaa';
  }

  @Get('bbb')
  @UseInterceptors(TimeInterceptor)
  bbb(): string {
    console.log('bbb...');
    return 'bbb';
  }

  @Get('ccc')
  // @UseFilters(TestFilter) 三种用法(路由, controller, main全局)
  ccc(@Query('num', ValidatePipe) num: number) {
    return num + 1;
  }
}

import { Controller, Get, HostParam, Req, Res, Next } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Controller({ host: ':host.0.0.1', path: 'aaa' })
export class AaaController {
  @Get('bbb')
  hello(@HostParam('host') host) {
    return host;
  }

  @Get('ccc')
  ccc(@Req() req: Request) {
    console.log('req.hostname', req.hostname);
    console.log('req.url', req.url);
  }

  @Get('ddd')
  ddd(@Res() res: Response) {
    // 引入Res后,  Nest 就不会再把 handler 返回值作为响应内容了
    return 'ddd';

    // res.end('ddd');
  }

  @Get('eee')
  eee(@Next() next: NextFunction) {
    console.log('handler1');
    next();
    return '111';
  }

  @Get('eee')
  eee2(@Req() req: Request) {
    // console.log('req', req);
    console.log('handler2');
    return 'eee';
  }
}

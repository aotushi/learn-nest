import {
  BeforeApplicationShutdown,
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { CccService } from './ccc.service';
import { CccController } from './ccc.controller';
import { ModuleRef } from '@nestjs/core';

@Module({
  controllers: [CccController],
  providers: [CccService],
})
export class CccModule
  implements
    OnModuleInit,
    OnApplicationBootstrap,
    OnModuleDestroy,
    BeforeApplicationShutdown,
    OnApplicationShutdown
{
  constructor(private moduleRef: ModuleRef) {}
  onModuleInit() {
    console.log('CccModule onModuleInit');
  }
  onApplicationBootstrap() {
    console.log('CccModule onApplicationBootstrap');
  }

  onModuleDestroy() {
    console.log('CccModule onModuleDestroy');
  }

  beforeApplicationShutdown(signal?: string) {
    console.log('CccModule beforeApplicationShutdown', signal);
  }

  onApplicationShutdown(signal?: string) {
    console.log('CccModule onApplicationShutdown', signal);

    const cccService = this.moduleRef.get<CccService>(CccService);
    console.log('---------------------', cccService.findAll());

    // console.log('this', this.moduleRef);
  }
}

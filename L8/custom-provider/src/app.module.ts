import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  // providers: [AppService],
  providers: [
    AppService,
    /**
     * // 等价于以下
     * {
        provide: AppService,
        useClass: AppService,
      }
     */
    {
      provide: 'app_service',
      useClass: AppService,
    },
    {
      provide: 'person',
      useValue: {
        name: 'wang',
        age: 20,
      },
    },
    {
      provide: 'person2',
      useFactory: () => ({
        name: 'bbb',
        age: 23,
      }),
    },
    {
      provide: 'person3',
      useFactory(person: { name: string }, appService: AppService) {
        return {
          name: person.name,
          desc: appService.getHello(),
        };
      },
      // 如果 factory 需要依赖别的 provider，可以配合 `inject`：
      // AppService, app_service
      inject: ['person', 'app_service'],
    },
    //
    {
      provide: 'person4',
      useExisting: 'person2',
    },
    // 异步
    {
      provide: 'person5',
      async useFactory() {
        await new Promise((resolve) => {
          setTimeout(resolve, 3000);
        });

        return {
          name: '5555',
          desc: 'cccc',
        };
      },
    },
  ],
})
export class AppModule {}

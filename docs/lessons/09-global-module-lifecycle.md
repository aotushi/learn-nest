# 09 全局模块和生命周期

## 本节目标

第 8 节学的是：

```text
一个 provider 可以用哪些方式注册和注入。
```

第 9 节继续往上走一层：

```text
一个 provider 属于哪个 module？什么时候能被别的 module 使用？应用启动和关闭时，Nest 会按什么时机调用代码？
```

学完这一节，需要能回答：

1. 普通模块里 provider 为什么不能随便被别的模块注入？
2. `exports` 和 `imports` 的关系是什么？
3. `@Global()` 全局模块解决什么问题？
4. 为什么不能把所有模块都做成全局模块？
5. `onModuleInit` 和 `onApplicationBootstrap` 有什么区别？
6. 应用关闭相关生命周期为什么通常需要 `enableShutdownHooks()`？
7. 生命周期钩子适合写什么，不适合写什么？

## 模块作用域：provider 默认不是全局的

在 Nest 中，provider 默认属于注册它的 module。

例如：

```ts
@Module({
  providers: [ConfigService],
})
export class ConfigModule {}
```

这表示：

```text
ConfigService 注册在 ConfigModule 里。
```

但这不表示别的模块自动可以使用 `ConfigService`。

如果 `UserModule` 想注入 `ConfigService`，通常需要两步：

1. `ConfigModule` 导出 `ConfigService`。
2. `UserModule` 导入 `ConfigModule`。

```ts
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

```ts
@Module({
  imports: [ConfigModule],
  providers: [UserService],
})
export class UserModule {}
```

这样 `UserService` 才能写：

```ts
@Injectable()
export class UserService {
  constructor(private readonly configService: ConfigService) {}
}
```

一句话：

```text
providers 负责在本模块注册。
exports 负责把 provider 暴露给其他模块。
imports 负责引入其他模块暴露出来的 provider。
```

## `imports` 不是 TypeScript import

这里容易和文件顶部的 `import` 混淆。

文件顶部的：

```ts
import { ConfigModule } from './config/config.module';
```

是 TypeScript / JavaScript 模块导入。

它只让当前文件认识 `ConfigModule` 这个名字。

Nest 里的：

```ts
@Module({
  imports: [ConfigModule],
})
export class UserModule {}
```

是 Nest module 依赖声明。

它告诉 Nest：

```text
UserModule 需要使用 ConfigModule exports 出来的 provider。
```

所以：

```text
import 解决“文件能不能引用这个类名”。
@Module imports 解决“Nest 容器能不能跨模块使用 exported provider”。
```

这和第 8 节里的结论类似：

```text
文件 import 不等于 Nest 容器注册。
```

## 什么是全局模块

如果某个模块被很多模块都需要，例如配置模块、日志模块、数据库模块，就可能出现大量重复导入：

```ts
@Module({
  imports: [ConfigModule],
})
export class UserModule {}

@Module({
  imports: [ConfigModule],
})
export class OrderModule {}

@Module({
  imports: [ConfigModule],
})
export class RoomModule {}
```

全局模块用 `@Global()` 声明：

```ts
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

然后只需要在根模块导入一次：

```ts
@Module({
  imports: [ConfigModule, UserModule, OrderModule],
})
export class AppModule {}
```

之后其他模块中就可以注入 `ConfigService`，不必每个模块都显式 `imports: [ConfigModule]`。

## 全局模块不是“所有东西都全局”

`@Global()` 只影响这个模块 `exports` 出去的 provider。

例如：

```ts
@Global()
@Module({
  providers: [ConfigService, InternalConfigLoader],
  exports: [ConfigService],
})
export class ConfigModule {}
```

全局可用的是：

```text
ConfigService
```

不是：

```text
InternalConfigLoader
```

原因是 `InternalConfigLoader` 没有被 `exports`。

所以全局模块仍然要注意：

```text
只有 exports 出去的 provider 才能被外部使用。
```

## 为什么不能滥用全局模块

全局模块看起来很方便，但不能所有模块都加 `@Global()`。

原因：

- 模块依赖关系会变隐式。
- 代码阅读时看不出某个 provider 从哪里来。
- 测试时更难判断需要准备哪些依赖。
- 大项目里容易出现 provider 来源混乱。
- 后期拆模块、拆包、拆微服务时成本更高。

更稳妥的规则：

```text
默认使用 imports/exports 显式声明依赖。
只有真正横切全局、低业务耦合、几乎所有模块都需要的能力，才考虑 @Global()。
```

适合全局模块的常见候选：

- 配置读取。
- 日志。
- 数据库连接基础设施。
- 全局缓存客户端。

不适合轻易全局化的模块：

- 用户业务模块。
- 订单业务模块。
- 会议室预订业务模块。
- 强业务规则服务。

## 生命周期是什么

生命周期指 Nest 应用从启动到关闭过程中，框架在特定阶段调用的钩子方法。

常见钩子：

| 钩子 | 大致时机 |
| --- | --- |
| `onModuleInit()` | 当前模块依赖初始化完成后 |
| `onApplicationBootstrap()` | 所有模块初始化完成，应用即将开始监听前后 |
| `onModuleDestroy()` | 应用关闭时，模块销毁阶段 |
| `beforeApplicationShutdown()` | 应用关闭前 |
| `onApplicationShutdown()` | 应用关闭时或关闭后清理阶段 |

这些方法可以写在 provider、controller 或 module class 上。

实际项目里，更常见的是写在 service/provider 上。

## 启动阶段的完整调用流程

课程里这一段是理解生命周期的关键，不能只记住几个钩子名字。

Nest 应用启动时，大致流程是：

```text
1. 递归初始化模块。
2. 对每个模块，先调用模块内部 controller、provider 的 onModuleInit。
3. 再调用这个 module class 自己的 onModuleInit。
4. 所有模块初始化完成后，进入 application bootstrap 阶段。
5. 对每个模块，先调用模块内部 controller、provider 的 onApplicationBootstrap。
6. 再调用这个 module class 自己的 onApplicationBootstrap。
7. 最后监听网络端口。
8. Nest 应用进入正常运行状态。
```

可以简化成：

```text
onModuleInit 阶段
  module 内部 controller/provider
  -> module 自身

onApplicationBootstrap 阶段
  module 内部 controller/provider
  -> module 自身

listen 端口
  -> 应用开始处理请求
```

这里的“递归初始化模块”可以理解为：

```text
Nest 会先根据 imports 关系，把模块依赖图中的模块都准备好。
```

所以生命周期不是单纯按文件顺序执行，也不是只看 `AppModule` 一个模块。

更准确的观察方式是：

```text
模块依赖图决定初始化范围；
每个模块内部先 controller/provider，后 module；
所有 onModuleInit 完成后，才进入 onApplicationBootstrap；
bootstrap 完成后，才开始监听端口。
```

这也解释了为什么：

- `onModuleInit` 适合做模块内部资源初始化。
- `onApplicationBootstrap` 适合做全应用都初始化后才能执行的逻辑。
- 启动阶段生命周期不是每次请求都会执行。
- 如果初始化逻辑很慢，会拖慢应用启动和监听端口的时间。

## `onModuleInit`

`onModuleInit` 适合做“模块级初始化”。

例子：

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ConfigService implements OnModuleInit {
  onModuleInit() {
    console.log('ConfigService module init');
  }
}
```

适合放：

- 初始化本模块内部缓存。
- 检查必要配置是否存在。
- 启动时预加载少量本模块数据。
- 初始化当前 provider 依赖的内部资源。

不适合放：

- 耗时很长的业务任务。
- 依赖整个应用都启动完成后的逻辑。
- 每次请求都应该执行的逻辑。

## `onApplicationBootstrap`

`onApplicationBootstrap` 适合做“应用级初始化完成后”的逻辑。

例子：

```ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class AppStartupService implements OnApplicationBootstrap {
  onApplicationBootstrap() {
    console.log('application bootstrap finished');
  }
}
```

它和 `onModuleInit` 的区别可以先这样记：

```text
onModuleInit 更偏当前模块初始化。
onApplicationBootstrap 更偏整个应用初始化完成。
```

如果某段逻辑需要等所有模块都加载完，再执行，优先考虑 `onApplicationBootstrap`。

## 关闭阶段生命周期

关闭阶段常见钩子：

```ts
onModuleDestroy()
beforeApplicationShutdown(signal?: string)
onApplicationShutdown(signal?: string)
```

例子：

```ts
import {
  Injectable,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';

@Injectable()
export class DatabaseService implements OnModuleDestroy, OnApplicationShutdown {
  onModuleDestroy() {
    console.log('module destroy: close local resources');
  }

  onApplicationShutdown(signal?: string) {
    console.log(`application shutdown by ${signal}`);
  }
}
```

适合放：

- 关闭数据库连接。
- 关闭 Redis 连接。
- 停止定时任务。
- flush 日志。
- 通知外部服务当前实例下线。

## `enableShutdownHooks`

要让 Nest 监听系统关闭信号，通常需要在 `main.ts` 中启用 shutdown hooks：

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
```

否则某些关闭钩子不会在 `Ctrl+C`、`SIGTERM` 等信号下按预期执行。

这里要记住：

```text
生命周期接口写了，不代表所有关闭信号都会自动触发。
需要根据场景启用 shutdown hooks。
```

## 生命周期和请求生命周期不是一回事

这一节的生命周期主要是应用级生命周期：

```text
应用启动 -> 模块初始化 -> 应用启动完成 -> 应用关闭 -> 资源清理
```

它不是每次 HTTP 请求都会执行的流程。

HTTP 请求生命周期是另一条线：

```text
Middleware -> Guard -> Interceptor -> Pipe -> Controller -> Service -> Interceptor response
```

所以：

```text
onModuleInit 不会每个请求执行一次。
onApplicationBootstrap 也不会每个请求执行一次。
```

它们是在应用启动或关闭时执行。

## 本地验证观察

本节在 `L9/global-and-lifecycle` 中实现了 `CccController`、`CccService`、`CccModule` 的生命周期钩子。

`pnpm -C L9/global-and-lifecycle test:e2e` 观察到的顺序是：

```text
CccControl onModuleInit
CccService onModuleInit
CccModule onModuleInit

CccControl onApplicationBootstrap
CccService onApplicationBootstrap
CccModule onApplicationBootstrap

CccControl onModuleDestroy
CccService onModuleDestroy
CccModule onModuleDestroy

CccControl beforeApplicationShutdown undefined
CccService beforeApplicationShutdown undefined
CccModule beforeApplicationShutdown undefined

CccControl onApplicationShutdown undefined
CccService onApplicationShutdown undefined
CccModule onApplicationShutdown undefined
```

这和课程里的流程可以对应起来：

```text
controller/provider 的 onModuleInit
-> module 的 onModuleInit
-> controller/provider 的 onApplicationBootstrap
-> module 的 onApplicationBootstrap
```

关闭阶段通过 `app.close()` 触发，所以 `signal` 是 `undefined`。

如果是系统信号触发，例如 `SIGTERM`，并且启用了：

```ts
app.enableShutdownHooks();
```

`beforeApplicationShutdown(signal)` 和 `onApplicationShutdown(signal)` 才更可能拿到具体信号名。

## 本节建议练习

建议创建：

```text
L9/global-and-lifecycle
```

练习顺序：

1. 创建 `ConfigModule` 和 `ConfigService`。
2. 不使用 `@Global()`，通过 `exports` + `imports` 在另一个模块中注入 `ConfigService`。
3. 给 `ConfigModule` 加 `@Global()`，只在 `AppModule` 导入一次。
4. 验证其他模块是否能直接注入 `ConfigService`。
5. 在 `ConfigService` 中实现 `OnModuleInit`。
6. 在某个 `StartupService` 中实现 `OnApplicationBootstrap`。
7. 在 `main.ts` 中添加 `app.enableShutdownHooks()`。
8. 实现 `OnModuleDestroy`、`beforeApplicationShutdown`、`onApplicationShutdown`，观察关闭时日志顺序。

## 常见误区

### 误区一：`@Global()` 后 provider 不需要 `exports`

不准确。

`@Global()` 不等于把 module 里的所有 provider 都暴露出去。

外部能用的仍然是 `exports` 中导出的 provider。

### 误区二：全局模块不需要在任何地方导入

不准确。

全局模块通常仍然需要至少在根模块或核心模块导入一次，让 Nest 知道它存在。

### 误区三：全局模块越多越方便

短期方便，长期容易让依赖来源变隐式。

默认还是应该优先显式 `imports`。

### 误区四：生命周期钩子每次请求都会执行

不准确。

`onModuleInit`、`onApplicationBootstrap` 等是应用启动/关闭阶段钩子，不是请求处理钩子。

每次请求相关的逻辑应该放在 middleware、guard、interceptor、pipe 或 controller/service 调用链中。

### 误区五：写了 `onApplicationShutdown` 就一定能响应 Ctrl+C

不一定。

很多关闭信号场景需要：

```ts
app.enableShutdownHooks();
```

## 本节检查清单

- [ ] 能解释 provider 默认属于注册它的 module。
- [ ] 能解释 `providers`、`exports`、`imports` 三者关系。
- [ ] 能写出一个普通模块跨模块注入 provider 的例子。
- [ ] 能写出 `@Global()` 全局模块例子。
- [ ] 能解释为什么全局模块仍然需要 `exports`。
- [ ] 能解释为什么不应该滥用全局模块。
- [ ] 能区分 `onModuleInit` 和 `onApplicationBootstrap`。
- [ ] 能说明关闭阶段生命周期钩子的用途。
- [ ] 能说明 `enableShutdownHooks()` 的作用。
- [ ] 能区分应用生命周期和请求生命周期。

## 参考资料

- Nest 官方文档：Modules：https://docs.nestjs.com/modules
- Nest 官方文档：Lifecycle events：https://docs.nestjs.com/fundamentals/lifecycle-events
- Nest 官方文档：Request lifecycle：https://docs.nestjs.com/faq/request-lifecycle

## 下一步

1. 已创建 `L9/global-and-lifecycle`。
2. 完成普通模块导入、全局模块、生命周期钩子的练习。
3. 练习后补充本节习题答案和实际日志观察结果。

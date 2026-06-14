# 10 AOP 架构有什么好处？

## 本节目标

前面几节主要在学 Nest 的模块系统和依赖注入：

```text
Module 组织代码。
Provider 提供对象。
DI 负责注入依赖。
生命周期负责启动和关闭阶段的钩子。
```

第 10 节开始进入 Nest 更核心的请求处理架构：

```text
业务代码不应该被日志、权限、校验、异常处理、响应格式化等横切逻辑淹没。
```

学完这一节，需要能回答：

1. AOP 是什么？
2. 什么叫横切关注点？
3. 为什么只写 Controller + Service 会让代码变乱？
4. Nest 里哪些机制体现了 AOP 思想？
5. Middleware、Guard、Interceptor、Pipe、Exception Filter 分别负责什么？
6. 请求进入 Nest 后大致经过什么顺序？
7. AOP 的好处和代价分别是什么？

## 什么是 AOP

AOP 是 Aspect Oriented Programming，面向切面编程。

它关注的问题不是：

```text
业务流程本身怎么写。
```

而是：

```text
业务流程前后，经常重复出现的通用逻辑应该放在哪里。
```

这些通用逻辑通常包括：

- 日志。
- 权限判断。
- 参数校验。
- 参数转换。
- 异常处理。
- 统一响应格式。
- 缓存。
- 性能统计。
- 链路追踪。

这些逻辑不属于某一个具体业务，但很多业务都会用到。

这种逻辑就叫：

```text
横切关注点
```

## 不使用 AOP 会出现什么问题

假设没有 AOP 机制，一个接口可能会写成这样：

```ts
@Get(':id')
async findOne(@Param('id') id: string) {
  console.log('request start');

  if (!id) {
    throw new Error('id is required');
  }

  const user = await this.authService.getCurrentUser();

  if (!user) {
    throw new Error('unauthorized');
  }

  const start = Date.now();
  const result = await this.catsService.findOne(Number(id));
  console.log(`cost: ${Date.now() - start}ms`);

  return {
    code: 0,
    message: 'success',
    data: result,
  };
}
```

这段代码的问题不是“不能运行”，而是职责混在一起了：

- Controller 既处理路由。
- 又做参数检查。
- 又做权限判断。
- 又做日志。
- 又做性能统计。
- 又包装响应格式。

如果每个接口都这么写，会导致：

- 重复代码多。
- 业务主线不清楚。
- 修改统一逻辑要改很多地方。
- 很难保证所有接口处理方式一致。
- 测试时也更难聚焦业务本身。

AOP 的目标就是把这些横切逻辑拆出去。

## AOP 的核心思想

可以把一次方法调用想象成：

```text
调用前
  -> 执行业务方法
调用后
```

AOP 允许我们在这些位置插入通用逻辑：

```text
调用前：鉴权、日志、参数校验、缓存判断。
调用中：控制是否继续执行业务逻辑。
调用后：响应转换、日志统计、异常转换。
```

在 Nest 里，这种能力不是只靠一个语法实现，而是分散在多个机制里：

- Middleware。
- Guard。
- Pipe。
- Interceptor。
- Exception Filter。
- Decorator + Metadata。

这一节重点先建立 AOP 视角。

后面的课程会逐个深入这些机制。

## Nest 请求处理链路

Nest 官方文档对请求生命周期有明确说明。

一次请求大致会经过：

```text
Request
  -> Middleware
  -> Guard
  -> Interceptor before
  -> Pipe
  -> Controller
  -> Service
  -> Interceptor after
  -> Response
```

如果过程中抛出异常，会进入异常处理链路：

```text
Exception
  -> Exception Filter
  -> Error Response
```

所以可以这样理解：

```text
Middleware 更靠近底层 HTTP 请求。
Guard 决定能不能进入路由处理。
Interceptor 包住 Controller 方法前后。
Pipe 处理进入方法参数前的校验和转换。
Exception Filter 处理异常输出。
```

这就是 Nest 架构里 AOP 思想的核心体现。

## 本节涉及的创建命令

Nest CLI 里没有一个叫 `aop` 的统一命令。

这一节所谓 AOP，实际是分别创建几类横切组件：

```bash
nest g middleware log --no-spec
nest g guard login --no-spec
nest g interceptor time --no-spec
nest g pipe validate --no-spec
nest g filter test --no-spec
```

对应生成：

| 命令 | 生成内容 | 主要用途 |
| --- | --- | --- |
| `nest g middleware log --no-spec` | `log.middleware.ts` | 请求进入路由前的预处理 |
| `nest g guard login --no-spec` | `login.guard.ts` | 判断请求能不能继续 |
| `nest g interceptor time --no-spec` | `time.interceptor.ts` | 包住 handler 前后，比如统计耗时 |
| `nest g pipe validate --no-spec` | `validate.pipe.ts` | 处理参数校验和转换 |
| `nest g filter test --no-spec` | `test.filter.ts` | 捕获异常并改造错误响应 |

这些命令只负责生成文件。

生成以后还要显式启用：

```text
Middleware：app.use(...) 或 consumer.apply(...).forRoutes(...)
Guard：@UseGuards(...)、app.useGlobalGuards(...)、APP_GUARD
Interceptor：@UseInterceptors(...)、app.useGlobalInterceptors(...)、APP_INTERCEPTOR
Pipe：@UsePipes(...)、参数装饰器中使用、app.useGlobalPipes(...)、APP_PIPE
Filter：@UseFilters(...)、app.useGlobalFilters(...)、APP_FILTER
```

## Middleware

Middleware 运行在比较靠前的位置。

常见用途：

- 记录原始请求日志。
- 添加请求 id。
- 处理 cookie。
- 做一些和具体 handler 无关的请求预处理。

它接近 Express / Fastify 这一层。

### 创建 Middleware

可以用 Nest CLI 创建 Middleware：

```bash
nest g middleware log --no-spec
```

生成后的 Middleware 大致是：

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LogMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('before request');
    next();
  }
}
```

这里的关键是 `next()`：

```text
调用 next()：请求继续往后走。
不调用 next()：请求会停在当前 middleware。
```

Middleware 可以拿到：

```text
req：原始请求对象。
res：原始响应对象。
next：继续执行后续链路的函数。
```

所以它更像底层 HTTP 请求进入 Nest 之前的前置处理。

Middleware 按挂载范围可以先分成两类：

```text
全局中间件：所有请求都会经过。
路由中间件：只有匹配到指定路由时才会经过。
```

### Middleware 的两类使用方式

课程里可以按两类用法理解：

```text
全局用法：所有请求都会经过。
路由用法：只有匹配到指定路由时才会经过。
```

### 用法一：全局注册到 main.ts

全局中间件通常在 `main.ts` 里注册：

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use((req, res, next) => {
    console.log('global middleware');
    next();
  });

  await app.listen(3000);
}
```

它适合放非常通用的逻辑，比如：

- 全局请求日志。
- 请求开始时间。
- 请求 id。
- 简单的原始请求预处理。

### 用法二：路由级使用

路由中间件通常在 module 里通过 `MiddlewareConsumer` 注册：

```ts
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('cats');
  }
}
```

它适合只作用在某些路由上，比如：

- 只记录某个模块的请求。
- 只处理某类接口的前置逻辑。
- 给特定路由加临时调试日志。

所以这里的关键不是“写在哪里”，而是：

```text
这个中间件应该影响所有请求，还是只影响一部分路由。
```

注意：

```text
Middleware 没有 @UseMiddleware() 这种 controller/handler 装饰器用法。
它的路由级使用是通过 MiddlewareConsumer.forRoutes(...) 做路由匹配。
```

### 路由通配符的版本差异

记录时间：

```text
2026-06-12 13:40:54 +08:00
```

当前项目 `L10/aop-test` 的实际依赖版本：

| 依赖 | 当前安装版本 | npm latest |
| --- | --- | --- |
| `@nestjs/core` | `11.1.26` | `11.1.26` |
| `@nestjs/common` | `11.1.26` | `11.1.26` |
| `@nestjs/platform-express` | `11.1.26` | `11.1.26` |
| `express` | `5.2.1` | `5.2.1` |
| `path-to-regexp` | `8.4.2` | `8.4.2` |

也就是说，这里遇到的报错不是旧依赖导致的，而是当前最新版依赖下的路由匹配规则变化。

课程里出现过这种写法：

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes('aaa*');
  }
}
```

这在旧版本里可以表达：

```text
匹配 aaa 开头的一批路由。
```

但当前项目使用的是：

```text
Nest 11
Express 5
path-to-regexp 8
```

新版 `path-to-regexp` 不再支持匿名 `*` 通配符。也就是说，下面这种路径会报错：

```text
/aaa*
```

报错核心意思是：

```text
* 现在表示通配参数，但通配参数必须有名字。
```

所以当前项目里不要直接照抄：

```ts
consumer.apply(LogMiddleware).forRoutes('aaa*');
```

可以按真实意图改成下面几种写法：

| 写法 | 匹配含义 |
| --- | --- |
| `forRoutes('aaa')` | 只匹配 `/aaa` |
| `forRoutes('aaa/*path')` | 匹配 `/aaa/xxx`，但不匹配 `/aaa` 本身 |
| `forRoutes('aaa{/*path}')` | 同时匹配 `/aaa` 和 `/aaa/xxx` |

如果课程这里想表达“`aaa` 以及 `aaa` 下面的所有子路径”，当前版本更推荐写：

```ts
consumer.apply(LogMiddleware).forRoutes('aaa{/*path}');
```

这里的 `path` 只是给通配参数起的名字，也可以换成别的合法名称。

特点：

```text
Middleware 知道 request 和 response。
但它通常不知道后面具体会执行哪个 Controller 方法。
```

所以它适合做比较通用、比较底层的请求预处理。

不适合做强依赖路由 handler 元数据的逻辑。

## Guard

Guard 的职责是：

```text
判断当前请求能不能继续执行。
```

常见用途：

- 登录校验。
- JWT 校验。
- 角色权限判断。
- 接口访问控制。

它和 Middleware 的重要区别是：

```text
Guard 可以拿到 ExecutionContext。
```

也就是说，它可以知道当前要执行哪个 Controller、哪个 handler。

这让它更适合做权限判断。

### 创建 Guard

可以用 Nest CLI 创建 Guard：

```bash
nest g guard login --no-spec
```

生成后的 Guard 大致是：

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class LoginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

这里的关键是 `canActivate`：

```text
它决定当前请求能不能继续往后走。
```

如果返回：

```ts
true
```

请求继续。

如果返回：

```ts
false
```

请求会被拒绝。

### 拿到 Controller 和 Handler

Guard 也可以通过 `ExecutionContext` 拿到当前 Controller 和 handler：

```ts
canActivate(context: ExecutionContext): boolean {
  const controller = context.getClass();
  const handler = context.getHandler();

  console.log(controller.name);
  console.log(handler.name);

  return true;
}
```

这里：

```text
context.getClass()：当前 Controller 类。
context.getHandler()：当前要执行的 Controller 方法。
```

所以 Guard 不只是“请求前执行一下”，它还可以知道当前请求准备进入哪个 Controller 方法。

这也是它适合做权限判断的原因。

### Guard 的三类使用方式

Guard 创建出来以后，重点看它作用在哪里。

课程里可以按三类用法理解：

```text
全局用法：整个应用所有路由都会经过。
路由用法：只作用在某个 Controller 或某个 handler。
模块用法：在 module 的 providers 里注册为全局 Guard。
```

其中“全局用法”又有两种写法。

### 用法一：全局注册到 main.ts

第一种全局写法是在 `main.ts` 里注册实例：

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalGuards(new LoginGuard());

  await app.listen(3000);
}
```

这表示：

```text
当前 Nest 应用里的所有已注册路由都会先经过 LoginGuard。
```

但要注意：

```text
这里的 LoginGuard 是自己 new 出来的。
```

所以如果 `LoginGuard` 内部还需要注入别的 provider，这种写法就不合适。

### 用法二：路由级使用

路由级使用通过 `@UseGuards()` 完成。

可以加在某个 handler 上：

```ts
@Get()
@UseGuards(LoginGuard)
findAll() {
  return this.catsService.findAll();
}
```

这表示：

```text
只有这个接口会经过 LoginGuard。
```

也可以加在 Controller 上：

```ts
@UseGuards(LoginGuard)
@Controller('cats')
export class CatsController {}
```

这表示：

```text
CatsController 下面的所有接口都会经过 LoginGuard。
```

所以这里的“路由级”不是只有单个方法，也包括 Controller 级。

它们都属于通过装饰器明确挂到某一批路由上。

### 用法三：模块里注册为全局 Guard

第三种写法是在 module 的 `providers` 里使用 `APP_GUARD`：

```ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoginGuard } from './login.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: LoginGuard,
    },
  ],
})
export class AppModule {}
```

这种写法的效果也是：

```text
把 LoginGuard 注册为全局 Guard。
```

注意：

```text
这里说的“模块用法”，指的是在 module 的 providers 中完成注册。
它的作用范围仍然是全局，不是只作用当前 module。
```

但它和 `app.useGlobalGuards(new LoginGuard())` 的区别是：

```text
LoginGuard 由 Nest 容器创建。
LoginGuard 可以继续注入 Service。
注册方式更符合模块化管理。
```

真实项目里，如果全局 Guard 需要依赖其他 provider，通常更适合用 `APP_GUARD`。

### Guard 中注入 Service

Guard 本身也可以是 Nest 管理的 provider。

所以 Guard 里可以注入 Service。

教程里出现过属性注入写法：

```ts
@Inject(AppService)
private appService: AppService;
```

意思是：

```text
从 Nest 容器中找到 AppService，然后注入到当前 Guard 实例的 appService 属性上。
```

更常见的写法是构造器注入：

```ts
@Injectable()
export class LoginGuard implements CanActivate {
  constructor(private readonly appService: AppService) {}

  canActivate(context: ExecutionContext): boolean {
    return this.appService.checkLogin();
  }
}
```

无论属性注入还是构造器注入，前提都是：

```text
LoginGuard 必须由 Nest 容器创建。
AppService 必须是当前模块可见的 provider。
```

如果是自己 `new LoginGuard()`，Nest 就没有机会帮它注入 `AppService`。

## Pipe

Pipe 的职责是：

```text
处理进入 Controller 方法之前的参数。
```

常见用途：

- 参数校验。
- 参数转换。
- DTO 校验。
- 字符串转数字。

### 创建 Pipe

可以用 Nest CLI 创建 Pipe：

```bash
nest g pipe validate --no-spec
```

生成后的 Pipe 大致是：

```ts
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ValidatePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
```

这里的关键是 `transform`：

```text
value：当前要进入 handler 的参数值。
metadata：参数的元信息，比如参数来源、类型等。
```

Pipe 可以做两件常见事情：

```text
返回处理后的值：请求继续，Controller 拿到新值。
抛出异常：请求不会进入 Controller。
```

### Pipe 的基本用法

最直观的是参数级 Pipe：

```ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

这里 `ParseIntPipe` 做的是：

```text
在参数进入 findOne 之前，把 id 转成 number。
如果转换失败，直接抛异常。
```

Pipe 适合处理“参数本身”的问题。

### Pipe 的几类使用方式

Pipe 创建出来以后，重点看它作用在哪里。

课程里可以按四类用法理解：

```text
参数级：只处理某一个参数。
方法级：处理某个 handler 的参数。
Controller 级：处理整个 Controller 下的参数。
全局级：处理整个应用里的参数。
```

### 用法一：参数级使用

参数级使用最精确：

```ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

这表示：

```text
只有 id 这个参数会经过 ParseIntPipe。
```

### 用法二：方法级使用

方法级使用通过 `@UsePipes()`：

```ts
@Post()
@UsePipes(ValidatePipe)
create(@Body() createCatDto: CreateCatDto) {
  return this.catsService.create(createCatDto);
}
```

这表示：

```text
这个 handler 的参数会经过 ValidatePipe。
```

### 用法三：Controller 级使用

Controller 级使用也是 `@UsePipes()`：

```ts
@UsePipes(ValidatePipe)
@Controller('cats')
export class CatsController {}
```

这表示：

```text
CatsController 下面的 handler 参数都会经过 ValidatePipe。
```

### 用法四：全局使用

第一种全局写法是在 `main.ts` 里注册实例：

```ts
app.useGlobalPipes(new ValidatePipe());
```

这种写法直观，但如果 `ValidatePipe` 内部需要注入其他 provider，就不适合自己 `new`。

第二种全局写法是在 module 的 `providers` 里使用 `APP_PIPE`：

```ts
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidatePipe } from './validate.pipe';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidatePipe,
    },
  ],
})
export class AppModule {}
```

注意：

```text
APP_PIPE 是在 module 里注册，但作用范围是全局。
```

## Interceptor

Interceptor 的职责是：

```text
包住 Controller 方法调用。
```

它可以在方法执行前后插入逻辑。

常见用途：

- 统计耗时。
- 统一响应格式。
- 响应数据转换。
- 缓存。
- 记录 handler 执行前后的日志。
- 改写异常或结果。

可以先用这个结构理解：

```text
interceptor before
  -> controller handler
interceptor after
```

它是 Nest 里最接近 AOP “环绕通知”概念的机制。

后面学 RxJS 和 Interceptor 时，还会看到它为什么经常和 Observable 配合。

### 创建 Interceptor

可以用 Nest CLI 创建 Interceptor：

```bash
nest g interceptor log --no-spec
```

创建出来以后，核心是实现 `intercept` 方法。

### Interceptor 的基本用法

Interceptor 通常实现 `NestInterceptor` 接口：

```ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('before controller handler');

    return next.handle().pipe(
      tap(() => {
        console.log('after controller handler');
      }),
    );
  }
}
```

这里要先记住两个参数：

```text
context：当前执行上下文，可以拿到 controller、handler、request 等信息。
next：代表后续要执行的 controller handler。
```

关键是这句：

```ts
return next.handle();
```

它表示：

```text
继续执行后面的 Controller 方法。
```

如果没有调用 `next.handle()`，后面的 Controller 方法就不会正常继续执行。

### 拿到 Controller 和 Handler

Interceptor 可以通过 `ExecutionContext` 拿到当前要执行的 Controller 和 handler：

```ts
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  const controller = context.getClass();
  const handler = context.getHandler();

  console.log(controller.name);
  console.log(handler.name);

  return next.handle();
}
```

这里：

```text
context.getClass()：拿到当前 Controller 类。
context.getHandler()：拿到当前要执行的 Controller 方法。
```

例如请求进入 `CatsController.findAll()` 时：

```text
controller.name 可能是 CatsController
handler.name 可能是 findAll
```

这就是 Interceptor 能做“通用逻辑”的原因之一：

```text
它既包住了方法调用，又能知道当前包住的是哪个 Controller 和哪个 handler。
```

### Interceptor 的三类使用方式

Interceptor 创建出来以后，课程里可以按三类用法理解：

```text
路由用法：只作用在某个 handler 或 Controller。
全局用法：整个应用所有路由都会经过。
模块用法：在 module 的 providers 里注册为全局 Interceptor。
```

其中“全局用法”也有两种写法。

### 用法一：路由级使用

Interceptor 可以只给某一个路由方法启用：

```ts
@Get()
@UseInterceptors(LogInterceptor)
findAll() {
  return this.catsService.findAll();
}
```

也可以给整个 Controller 启用：

```ts
@UseInterceptors(LogInterceptor)
@Controller('cats')
export class CatsController {}
```

这两种都属于通过 `@UseInterceptors()` 明确挂到某一批路由上。

### 用法二：全局注册到 main.ts

第一种全局写法是在 `main.ts` 里直接注册实例：

```ts
app.useGlobalInterceptors(new LogInterceptor());
```

这种写法直观，但如果 `LogInterceptor` 内部需要注入其他 provider，就不适合自己 `new`。

### 用法三：模块里注册为全局 Interceptor

第二种全局写法是在 module 的 `providers` 里使用 `APP_INTERCEPTOR`：

```ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogInterceptor } from './log.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
  ],
})
export class AppModule {}
```

这种写法由 Nest 容器创建 `LogInterceptor`，更适合真实项目。

注意：

```text
APP_INTERCEPTOR 是在 module 里注册，但作用范围是全局。
```

## Exception Filter

Exception Filter 的职责是：

```text
捕获异常，并决定异常响应怎么返回。
```

常见用途：

- 统一异常响应格式。
- 区分业务异常和系统异常。
- 记录异常日志。
- 屏蔽内部错误细节。

如果没有自定义 filter，Nest 也有内置异常层来处理未捕获异常。

自定义 filter 的价值在于：

```text
把散落在业务代码里的 try/catch 和错误响应格式统一收口。
```

### 创建 Exception Filter

可以用 Nest CLI 创建 Filter：

```bash
nest g filter http-exception --no-spec
```

生成后的 Filter 大致是：

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    response.status(exception.getStatus()).json({
      path: request.url,
      message: exception.message,
    });
  }
}
```

这里要先记住：

```text
@Catch(HttpException)：说明这个 filter 处理哪类异常。
catch(...)：异常发生后会进入这里。
ArgumentsHost：可以切换到 HTTP 上下文，拿 request、response。
```

### Filter 的基本用法

Filter 关注的是：

```text
异常发生以后，响应应该怎么返回。
```

它通常会做：

```text
拿异常对象。
拿 request/response。
设置 HTTP 状态码。
返回统一格式的错误响应。
```

所以它不是用来判断能不能访问，也不是用来转换普通参数。

它只处理异常链路。

### Filter 的三类使用方式

Filter 创建出来以后，课程里可以按三类用法理解：

```text
路由用法：只处理某个 handler 或 Controller 的异常。
全局用法：处理整个应用的异常。
模块用法：在 module 的 providers 里注册为全局 Filter。
```

其中“全局用法”也有两种写法。

### 用法一：路由级使用

可以加在某个 handler 上：

```ts
@Get()
@UseFilters(HttpExceptionFilter)
findAll() {
  throw new HttpException('error', 400);
}
```

也可以加在 Controller 上：

```ts
@UseFilters(HttpExceptionFilter)
@Controller('cats')
export class CatsController {}
```

这两种都属于通过 `@UseFilters()` 明确挂到某一批路由上。

### 用法二：全局注册到 main.ts

第一种全局写法是在 `main.ts` 里注册实例：

```ts
app.useGlobalFilters(new HttpExceptionFilter());
```

这种写法直观，但如果 `HttpExceptionFilter` 内部需要注入其他 provider，就不适合自己 `new`。

### 用法三：模块里注册为全局 Filter

第二种全局写法是在 module 的 `providers` 里使用 `APP_FILTER`：

```ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './http-exception.filter';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

注意：

```text
APP_FILTER 是在 module 里注册，但作用范围是全局。
```

## AOP 组件的作用级别

Middleware、Guard、Pipe、Interceptor、Exception Filter 都是在请求链路里插入逻辑。

但它们不一定都作用于所有请求。

学习时要同时关注两个问题：

```text
它在请求链路的哪个位置执行？
它作用在哪些请求或方法上？
```

常见作用级别可以先这样记：

| 类型 | 全局级别 | Controller 级别 | 方法级别 | 参数级别 |
| --- | --- | --- | --- | --- |
| Middleware | 支持 | 通过路由匹配实现 | 通过路由匹配实现 | 不适用 |
| Guard | 支持 | 支持 | 支持 | 不适用 |
| Pipe | 支持 | 支持 | 支持 | 支持 |
| Interceptor | 支持 | 支持 | 支持 | 不适用 |
| Exception Filter | 支持 | 支持 | 支持 | 不适用 |

选择作用级别时，可以按这个原则判断：

```text
所有接口都应该一致的逻辑，才考虑全局。
某个模块或 Controller 独有的逻辑，放在 Controller 级。
某个接口独有的逻辑，放在方法级。
只和某个参数有关的逻辑，优先考虑参数级 Pipe。
```

## AOP 在 Nest 中的分工

可以先用这个表记忆：

| 机制 | 位置 | 适合处理 |
| --- | --- | --- |
| Middleware | 最靠前，接近 HTTP 层 | 原始请求预处理、请求日志、cookie |
| Guard | handler 前 | 鉴权、权限、是否允许继续 |
| Pipe | 参数进入 handler 前 | 参数校验、参数转换 |
| Interceptor | handler 前后 | 日志、耗时、响应转换、缓存 |
| Exception Filter | 异常发生后 | 统一异常响应、异常日志 |

更简化一点：

```text
Middleware：先处理请求。
Guard：能不能进。
Pipe：参数对不对。
Interceptor：前后包一层。
Filter：出错怎么办。
```

## 和前面课程的关系

第 5 节的 HTTP 参数传递解决的是：

```text
请求数据怎么进入 Controller。
```

第 6 到 9 节解决的是：

```text
对象怎么被组织、创建、注入、初始化。
```

第 10 节开始解决：

```text
请求处理过程中的通用逻辑应该放在哪里。
```

也就是说，现在开始要从“会写接口”升级到“会组织接口周边逻辑”。

## 真实项目里的例子

以一个需要登录的接口为例：

```ts
@Get('profile')
getProfile() {
  return this.userService.getProfile();
}
```

如果没有 AOP，可能要在方法里写：

- 取 token。
- 校验 token。
- 查用户。
- 判断权限。
- 打日志。
- try/catch。
- 包装响应。

用了 Nest 的 AOP 机制后，可以拆成：

```text
Guard：校验登录和权限。
Pipe：校验参数。
Interceptor：记录耗时、统一响应。
Exception Filter：统一异常格式。
Controller：只表达当前接口做什么。
Service：只处理业务逻辑。
```

这样 Controller 可以保持很薄：

```ts
@Get('profile')
getProfile() {
  return this.userService.getProfile();
}
```

业务主线会更清楚。

## AOP 的好处

### 1. 减少重复代码

日志、鉴权、异常处理不需要每个接口都写一遍。

### 2. 保持业务代码干净

Controller 和 Service 可以更专注业务主线。

### 3. 统一行为

所有接口可以使用同一套参数校验、异常格式、响应格式。

### 4. 更容易扩展

新增一个日志 interceptor，可能就能覆盖很多接口。

### 5. 更容易测试

业务测试可以聚焦业务逻辑，横切逻辑可以单独测试。

## AOP 的代价

AOP 不是只有好处。

它的代价是：

- 执行链路变长。
- 新手不容易看出一段逻辑在哪里触发。
- 过度抽象会让调试变难。
- 全局注册太多东西，会让行为来源不清楚。

所以要避免：

```text
什么都往全局 interceptor/filter/guard 里塞。
```

更好的做法：

```text
只有真正通用的横切逻辑才抽出去。
业务强相关逻辑仍然留在业务模块里。
```

## 本节建议练习

建议创建：

```text
L10/aop-demo
```

练习顺序：

1. 先写一个普通 Controller 方法，里面包含日志、参数校验、响应包装等混杂逻辑。
2. 把是否允许访问的逻辑抽成 Guard。
3. 把参数转换/校验逻辑抽成 Pipe。
4. 把耗时统计和响应包装抽成 Interceptor。
5. 把异常格式化抽成 Exception Filter。
6. 对比抽取前后的 Controller 代码。
7. 记录请求执行顺序。

这一节可以先不追求每个机制都写得很完整。

核心目标是理解：

```text
AOP 不是某一个装饰器，而是一种把横切逻辑从业务主线拆出去的架构思想。
```

## 常见误区

### 误区一：AOP 就等于 Interceptor

不准确。

Interceptor 很典型地体现了 AOP，但 Nest 的 Guard、Pipe、Filter、Middleware 也都承担了横切逻辑拆分的职责。

### 误区二：所有通用逻辑都应该全局化

不准确。

全局化会降低显式性。

只有真正全局一致的逻辑，才适合全局注册。

### 误区三：AOP 会替代业务代码

不会。

AOP 处理的是横切关注点。

业务规则本身仍然应该放在 Controller / Service / Domain 层里。

### 误区四：Middleware、Guard、Interceptor 差不多

不一样。

它们都可以插入请求链路，但位置和能力不同：

```text
Middleware 更靠近底层请求。
Guard 更适合做能不能访问。
Interceptor 更适合包住 handler 前后。
```

### 误区五：流程顺序不重要

不对。

AOP 机制的价值和限制都和执行顺序有关。

例如：

```text
Guard 在 Pipe 前面。
Pipe 主要处理 handler 参数。
Interceptor 有 before 和 after 两段。
Filter 处理异常响应。
```

如果顺序理解错，调试时很容易找错位置。

## 本节检查清单

- [ ] 能解释 AOP 是什么。
- [ ] 能说出横切关注点的例子。
- [ ] 能解释不使用 AOP 时 Controller 为什么会膨胀。
- [ ] 能画出 Nest 请求处理的大致链路。
- [ ] 能区分全局中间件和路由中间件。
- [ ] 能区分 Middleware、Guard、Pipe、Interceptor、Exception Filter 的职责。
- [ ] 能按“创建、基本结构、使用方式”说明每个 AOP 组件。
- [ ] 能区分全局级、Controller 级、方法级、参数级的作用范围。
- [ ] 能说明 Interceptor 为什么最像环绕通知。
- [ ] 能说出 AOP 的好处。
- [ ] 能说出 AOP 的代价。
- [ ] 能判断某段逻辑应该留在业务代码里，还是抽成横切逻辑。

## 参考资料

- Nest 官方文档：Request lifecycle：https://docs.nestjs.com/faq/request-lifecycle
- Nest 官方文档：Middleware：https://docs.nestjs.com/middleware
- Nest 官方文档：Guards：https://docs.nestjs.com/guards
- Nest 官方文档：Pipes：https://docs.nestjs.com/pipes
- Nest 官方文档：Interceptors：https://docs.nestjs.com/interceptors
- Nest 官方文档：Exception filters：https://docs.nestjs.com/exception-filters

## 下一步

1. 创建 `L10/aop-demo`。
2. 用一个接口先写“混杂版本”，再拆成 Guard、Pipe、Interceptor、Filter。
3. 记录实际请求顺序和每个机制适合放什么逻辑。

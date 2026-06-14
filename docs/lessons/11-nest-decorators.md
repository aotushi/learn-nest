# 11 一网打尽 Nest 全部装饰器

## 本节目标

这一节不是学习一个新的运行机制，而是把前面已经见过、后面还会继续用到的 Nest 装饰器集中整理。

学完这一节，需要能回答：

1. 装饰器在 Nest 里解决什么问题？
2. Nest 装饰器按作用位置可以分成哪几类？
3. `@Module()`、`@Controller()`、`@Injectable()` 分别声明了什么？
4. 路由方法装饰器和参数装饰器如何配合处理 HTTP 请求？
5. AOP 相关装饰器 `@UseGuards()`、`@UseInterceptors()`、`@UsePipes()`、`@UseFilters()` 分别挂在哪里？
6. `@Inject()`、`@Optional()` 这类注入相关装饰器和 Provider 有什么关系？
7. `@SetMetadata()` 这类 metadata 装饰器为什么后面会和 Guard / Reflector 一起出现？

## 课程主线

这一节可以按这个顺序理解：

```text
装饰器不是 Nest 独有语法
  -> Nest 用装饰器给 class、method、parameter、property 添加元信息
  -> Nest 启动时读取这些元信息
  -> 根据元信息完成模块组织、路由映射、依赖注入、AOP 挂载、参数提取等工作
```

一句话：

```text
装饰器是 Nest 声明框架行为的主要方式。
```

前面已经不断见过装饰器：

```ts
@Module()
@Controller()
@Injectable()
@Get()
@Post()
@Body()
@Param()
@UseGuards()
@UseInterceptors()
@Inject()
```

这一节的价值是把它们放到一张图里看。

## 装饰器按作用位置分类

可以先按 TypeScript 层面的作用位置分：

| 位置 | 例子 | 作用 |
| --- | --- | --- |
| Class 装饰器 | `@Module()`、`@Controller()`、`@Injectable()`、`@Catch()` | 声明这个 class 在 Nest 里扮演什么角色 |
| Method 装饰器 | `@Get()`、`@Post()`、`@UseGuards()` | 声明某个方法如何被框架调用或包裹 |
| Parameter 装饰器 | `@Body()`、`@Param()`、`@Query()` | 声明方法参数从请求哪里来 |
| Property 装饰器 | `@Inject()` | 声明某个属性需要由容器注入 |

这个分类很重要，因为装饰器不是都挂在同一个地方。

例如：

```ts
@Controller('cats')
export class CatsController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    return id;
  }
}
```

这里：

```text
@Controller('cats')：class 装饰器。
@Get(':id')：method 装饰器。
@Param('id')：parameter 装饰器。
```

## 模块和依赖注入相关装饰器

### `@Module()`

`@Module()` 用来声明模块。

常见配置：

```ts
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
```

它告诉 Nest：

```text
这个模块导入了哪些模块。
这个模块有哪些 Controller。
这个模块有哪些 Provider。
这个模块对外导出哪些 Provider。
```

这和 L6 到 L9 的内容直接相关。

### `@Controller()`

`@Controller()` 用来声明 Controller，并设置路由前缀：

```ts
@Controller('cats')
export class CatsController {}
```

它告诉 Nest：

```text
这个 class 是 HTTP 请求入口。
里面的路由方法应该被收集成路由映射。
```

### `@Injectable()`

`@Injectable()` 用来声明这个 class 可以交给 Nest 容器管理：

```ts
@Injectable()
export class CatsService {}
```

常见对象：

```text
Service
Guard
Pipe
Interceptor
Repository
工具类 Provider
```

注意：

```text
@Injectable() 不等于自动全局可用。
它还需要出现在某个 module 的 providers 中，或者通过其他 provider 方式注册。
```

### `@Inject()`

`@Inject()` 用来显式指定注入 token。

属性注入：

```ts
@Inject(AppService)
private appService: AppService;
```

构造器参数注入：

```ts
constructor(
  @Inject('APP_CONFIG') private readonly config: AppConfig,
) {}
```

它和 L8 的多种 Provider 直接相关：

```text
class token
string token
symbol token
custom provider
```

### `@Optional()`

`@Optional()` 表示这个依赖不是必须存在。

```ts
constructor(
  @Optional() private readonly logger?: LoggerService,
) {}
```

它的含义是：

```text
如果容器里能找到依赖，就注入。
如果找不到，也不要直接报错。
```

真实项目里不常滥用，但理解它有助于看懂一些可选能力的封装。

## HTTP 路由装饰器

HTTP 方法装饰器用来把 Controller 方法注册成路由。

常见有：

```ts
@Get()
@Post()
@Put()
@Patch()
@Delete()
@Options()
@Head()
@All()
```

示例：

```ts
@Controller('cats')
export class CatsController {
  @Get()
  findAll() {
    return 'find all cats';
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return id;
  }

  @Post()
  create(@Body() body: CreateCatDto) {
    return body;
  }
}
```

对应关系：

```text
GET /cats      -> findAll
GET /cats/:id  -> findOne
POST /cats     -> create
```

这和 L5 的 HTTP 数据传输方式直接相关。

## HTTP 参数装饰器

参数装饰器用来声明 Controller 方法参数从哪里取值。

常见有：

| 装饰器 | 数据来源 |
| --- | --- |
| `@Param()` | URL path params |
| `@Query()` | query string |
| `@Body()` | request body |
| `@Headers()` | request headers |
| `@Ip()` | client ip |
| `@Session()` | session |
| `@Req()` / `@Request()` | 原始 request 对象 |
| `@Res()` / `@Response()` | 原始 response 对象 |
| `@Next()` | Express next function |
| `@HostParam()` | host 参数 |

### `@Next()` 会把请求交给下一个匹配处理器

`@Next()` 可以拿到 Express 的 `next` 函数。

课程里的 `eee` 用例核心是：同一个路径可以写两个 handler，第一个 handler 调用 `next()` 后，请求会继续交给下一个匹配的 handler。

```ts
import { Controller, Get, Next } from '@nestjs/common';
import type { NextFunction } from 'express';

@Controller('aaa')
export class AaaController {
  @Get('eee')
  eee(@Next() next: NextFunction) {
    console.log('handler1');
    next();
    return '111';
  }

  @Get('eee')
  eee2() {
    console.log('handler2');
    return 'eee';
  }
}
```

请求：

```text
GET /aaa/eee
```

执行结果：

```text
handler1
handler2
```

最终响应体通常来自第二个 handler：

```text
eee
```

这里要注意：

```text
第一个 handler 注入了 @Next()。
它调用 next() 后，请求继续往后走。
它的 return '111' 不再按普通 Controller 返回值处理。
```

所以 `@Next()` 和 `@Res()` 一样，都会让这个 handler 进入更接近 Express 原生的处理方式。区别是：

| 装饰器 | 主要动作 | 常见结果 |
| --- | --- | --- |
| `@Res()` | 自己发送响应 | 用 `res.send/json/end` 结束请求 |
| `@Next()` | 把请求交给下一个匹配处理器 | 当前 handler 的 `return` 通常不作为响应体 |

实际业务里不建议频繁用这种写法。Nest 更常见的做法是用 Middleware、Guard、Pipe、Interceptor、Filter 来组织前置逻辑和公共逻辑。

### `@Res()` 会接管响应

`@Res()` / `@Response()` 可以拿到 Express 的原始响应对象。

课程里如果写：

```ts
import type { Response } from 'express';

@Get('res')
res(@Res() response: Response) {
  response.end('hello');
}
```

这里的响应体来自：

```text
response.end('hello')
```

而不是来自 handler 的 `return`。

默认情况下，只要方法参数里用了 `@Res()`，Nest 就认为你要自己处理响应：

```text
设置状态码
设置响应头
发送响应体
结束响应
```

所以这时如果只写：

```ts
@Get('res')
res(@Res() response: Response) {
  return 'hello';
}
```

`return 'hello'` 不会按普通 Controller 返回值那样自动变成 HTTP 响应体。因为原始 `response` 已经被交给你了，但你没有调用 `response.send()`、`response.json()` 或 `response.end()`，请求可能会一直挂起。

可以这样记：

| 写法 | 谁负责发送响应 | `return` 是否作为响应体 |
| --- | --- | --- |
| 不使用 `@Res()` | Nest | 是 |
| 使用 `@Res()` | 你自己调用 `res.send/json/end` | 否 |
| 使用 `@Res({ passthrough: true })` | Nest 仍负责最终返回 | 是 |

如果既想设置 header，又想继续使用 `return`，可以写：

```ts
import type { Response } from 'express';

@Get('res')
res(@Res({ passthrough: true }) response: Response) {
  response.setHeader('x-test', 'hello');
  return 'hello';
}
```

这时 `response` 只用于补充响应信息，最终响应体仍由 `return 'hello'` 交给 Nest 处理。

### `@Session()` 需要先启用 session 中间件

`@Session()` 不是只写参数装饰器就能直接工作。

它依赖 HTTP 层已经给 request 挂上了 session 对象。

课程里需要先安装 session 中间件：

```bash
pnpm add express-session
pnpm add -D @types/express-session
```

然后在 `main.ts` 里注册：

```ts
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: false,
    }),
  );

  await app.listen(3000);
}
```

然后 Controller 里才能通过 `@Session()` 取到 session：

```ts
@Get('session')
session(@Session() session: Record<string, any>) {
  session.count = (session.count ?? 0) + 1;
  return session.count;
}
```

触发链路是：

```text
请求进入 Nest
  -> express-session middleware 先处理 cookie 和 session
  -> request 上出现 session
  -> @Session() 从 request.session 取值
  -> handler 使用 session
  -> 响应结束前 express-session 按需写入 Set-Cookie
```

所以要记住：

```text
@Session() 是参数装饰器。
express-session 是让 request.session 存在的中间件。
两者不是一回事。
```

如果第一次真正写入 session，响应头里可能出现类似内容：

```text
Set-Cookie: connect.sid=s%3A<sessionId>.<signature>; Path=/; Expires=<GMT time>; HttpOnly
```

这些字段不是 Controller 手写出来的，而是 `express-session` 根据配置和默认值生成的：

| 字段 | 来源 |
| --- | --- |
| `connect.sid` | 默认 cookie 名称，可以通过 `name` 配置修改。 |
| `s%3A...` | URL 编码后的 signed session id；解码后大致是 `s:<sessionId>.<signature>`。 |
| `sessionId` | `express-session` 自动生成的随机 id，用来让浏览器下次请求时找回服务端 session。 |
| `signature` | 使用 `secret` 对 session id 做签名，防止客户端伪造或篡改。 |
| `Path=/` | cookie 作用路径，默认 `/`，表示当前站点下的路径都会携带它。 |
| `Expires=...GMT` | 由 `cookie.maxAge` 计算出来，显示为 GMT/UTC 时间。 |
| `HttpOnly` | 默认开启，前端 JS 不能通过 `document.cookie` 读取它。 |

所以 `session` 对象和 cookie 不是同一个东西：

```text
session 对象：服务端用于保存状态的数据。
connect.sid cookie：浏览器保存的 session 标识。
```

后续请求时，浏览器自动带上 `connect.sid`，服务端再根据这个 id 找回对应的 session 数据。

当前项目还要注意两个本地差异：

```text
1. express-session 是 CommonJS 包，当前 Nest 11 项目是 nodenext/ESM 风格。
2. express-session 需要显式配置 resave 和 saveUninitialized。
```

不要写：

```ts
import * as session from 'express-session';
```

在当前项目里，这可能拿到模块命名空间对象，运行时报：

```text
TypeError: session is not a function
```

推荐写：

```ts
import session from 'express-session';
```

如果省略 `resave` 和 `saveUninitialized`：

```ts
session({
  secret: 'wang',
  cookie: { maxAge: 100000 },
});
```

启动时会出现类似警告：

```text
express-session deprecated undefined resave option; provide resave option
express-session deprecated undefined saveUninitialized option; provide saveUninitialized option
```

本地练习建议显式补上：

```ts
resave: false,
saveUninitialized: false,
```

示例：

```ts
@Get(':id')
findOne(
  @Param('id') id: string,
  @Query('type') type: string,
  @Headers('user-agent') userAgent: string,
) {
  return { id, type, userAgent };
}
```

请求：

```text
GET /decorators/123?type=vip
```

取值关系：

```text
@Param('id') 取到 123。
@Query('type') 取到 vip。
@Headers('user-agent') 取到请求头里的 user-agent。
```

预期输出：

```json
{
  "id": "123",
  "type": "vip",
  "userAgent": "..."
}
```

注意：

```text
参数装饰器只负责取值。
参数校验和转换通常交给 Pipe。
```

例如：

```ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return id + 1;
}
```

这里：

```text
@Param('id') 负责从 URL 里取 id。
ParseIntPipe 负责把 id 转成 number。
```

## 响应相关装饰器

### `@HttpCode()`

用来指定响应状态码：

```ts
@Post()
@HttpCode(204)
create() {}
```

### `@Header()`

用来设置响应头：

```ts
@Get()
@Header('Cache-Control', 'none')
findAll() {
  return 'ok';
}
```

### `@Redirect()`

用来重定向：

```ts
@Get('docs')
@Redirect('https://docs.nestjs.com', 302)
docs() {}
```

### `@Render()`

用来渲染模板页面：

```ts
@Get()
@Render('index')
root() {
  return { message: 'hello' };
}
```

`@Render()` 不能只靠 Controller 里的装饰器独立工作。

要先在 `main.ts` 里告诉 Nest / Express：

```text
静态资源目录在哪里。
模板文件目录在哪里。
使用哪种模板引擎。
```

课程里这块对应的是静态资源、模板目录、模板引擎配置。

本地练习可以先安装模板引擎：

```bash
pnpm add hbs
```

然后在 `main.ts` 中配置：

```ts
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(3000);
}
bootstrap();
```

目录结构示例：

```text
L11/all-decorator/
  public/
    index.css
  views/
    index.hbs
  src/
    main.ts
    app.controller.ts
```

`views/index.hbs` 示例：

```hbs
<html>
  <head>
    <link rel="stylesheet" href="/index.css" />
  </head>
  <body>
    <h1>{{message}}</h1>
  </body>
</html>
```

Controller：

```ts
@Get('page')
@Render('index')
page() {
  return { message: 'hello' };
}
```

请求：

```text
GET /page
```

触发链路：

```text
@Render('index') 指定渲染 views/index.hbs。
handler return { message: 'hello' }。
返回对象不是直接 JSON 响应，而是作为模板数据传给 index.hbs。
模板里的 {{message}} 被替换为 hello。
浏览器再通过 /index.css 请求 public/index.css。
```

注意：

```text
setBaseViewsDir() 配置的是模板目录。
setViewEngine() 配置的是模板引擎。
useStaticAssets() 配置的是静态资源目录。
```

`handlerbars` 应理解为 `handlebars`。在本地 Nest/Express 练习里，常见写法是安装 `hbs` 并配置 `setViewEngine('hbs')`。

这些装饰器比 `@Get()` 更偏响应控制。

## AOP 相关装饰器

这部分和 L10 强相关。

### `@UseGuards()`

```ts
@UseGuards(LoginGuard)
@Get('profile')
profile() {}
```

作用：

```text
请求进入 handler 前，先判断能不能继续。
```

### `@UsePipes()`

```ts
@UsePipes(ValidatePipe)
@Post()
create(@Body() dto: CreateCatDto) {}
```

作用：

```text
参数进入 handler 前，先做校验或转换。
```

### `@UseInterceptors()`

```ts
@UseInterceptors(TimeInterceptor)
@Get()
findAll() {}
```

作用：

```text
包住 handler 前后，可以统计耗时、转换响应、做缓存等。
```

### `@UseFilters()`

```ts
@UseFilters(HttpExceptionFilter)
@Get()
findAll() {}
```

作用：

```text
捕获异常并改造错误响应。
```

作用范围可以是：

```text
Controller 级。
方法级。
```

全局级通常通过 `app.useGlobalXxx()` 或 `APP_XXX` provider 注册。

运行链路示例：

```ts
@Get('profile')
@UseGuards(LoginGuard)
@UseInterceptors(TimeInterceptor)
profile() {
  return 'profile';
}
```

```text
请求进入 profile。
LoginGuard 先判断能不能继续。
TimeInterceptor before 执行。
profile handler 执行。
TimeInterceptor after 执行。
返回响应。
```

## Metadata 相关装饰器

### `@SetMetadata()`

`@SetMetadata()` 用来给 class 或 method 添加自定义元数据。

例如：

```ts
@SetMetadata('roles', ['admin'])
@Get('admin')
adminOnly() {
  return 'admin';
}
```

这段代码本身不会自动完成权限校验。

它只是声明：

```text
这个 handler 需要 admin 角色。
```

真正读取这个元数据并做判断的，通常是 Guard：

```text
@SetMetadata 写入 metadata。
Reflector 读取 metadata。
Guard 根据 metadata 判断是否放行。
```

所以这节只是先认识 `@SetMetadata()`。

后面学习 Metadata 和 Reflector 时才会深入。

## 文件上传和流式响应相关装饰器

文件上传时常见：

```ts
@UseInterceptors(FileInterceptor('file'))
@Post('upload')
upload(@UploadedFile() file: Express.Multer.File) {
  return file.filename;
}
```

多个文件：

```ts
@Post('files')
@UseInterceptors(FilesInterceptor('files'))
upload(@UploadedFiles() files: Express.Multer.File[]) {
  return files.length;
}
```

这里：

```text
@UploadedFile() / @UploadedFiles() 负责取上传后的文件对象。
FileInterceptor / FilesInterceptor 负责处理 multipart/form-data。
```

SSE 场景会用到：

```ts
@Sse('events')
events() {
  return interval(1000).pipe(map(() => ({ data: 'hello' })));
}
```

这些不一定是本节重点，但先知道它们也属于 Nest 装饰器体系。

## WebSocket 和微服务相关装饰器

后续课程可能会遇到：

```ts
@WebSocketGateway()
@SubscribeMessage('message')
@MessageBody()
@ConnectedSocket()
```

大致含义：

| 装饰器 | 作用 |
| --- | --- |
| `@WebSocketGateway()` | 声明 WebSocket 网关 |
| `@SubscribeMessage()` | 订阅某类 websocket 消息 |
| `@MessageBody()` | 获取消息体 |
| `@ConnectedSocket()` | 获取 socket 连接对象 |

微服务里也会出现：

```ts
@MessagePattern()
@EventPattern()
@Payload()
@Ctx()
```

这一节先不用深入，只要建立认知：

```text
Nest 不只 HTTP 使用装饰器，WebSocket 和微服务也大量使用装饰器声明入口和参数来源。
```

## Commands

本节没有统一创建命令。

和 L10 不同，这一节不是创建某一个具体组件。

它主要是在已有项目里观察和整理装饰器。

如果练习 `@Session()`，课程中需要安装 session 中间件：

```bash
pnpm add express-session
pnpm add -D @types/express-session
```

建议沿用当前 `L10/aop-test` 或后续创建：

```text
L11/decorators-demo
```

## Generated Files

本节如果只做装饰器盘点，不会由课程命令生成固定文件。

建议练习时可以手动新增：

```text
L11/decorators-demo/src/decorators.controller.ts
```

如果练习 `@Session()`，还会改到：

```text
src/main.ts
package.json
pnpm-lock.yaml
```

最小练习可以只写一个 Controller：

```ts
@Controller('decorators')
export class DecoratorsController {
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('type') type: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return { id, type, userAgent };
  }
}
```

## 运行自测索引

主要运行例子已经放回对应子章节。

这里仅保留自测索引，用来快速确认本节练习是否跑通：

| 请求或动作 | 对应知识点 | 主要查看内容 |
| --- | --- | --- |
| `GET /decorators/123?type=vip` | `@Param()`、`@Query()`、`@Headers()` | 返回值是否来自 path、query、header。 |
| `GET http://host.localhost:3000/aaa/bbb` | `@HostParam()` | host 条件是否匹配，`host` 参数是否被取出。 |
| `GET /aaa/ccc` | `@Req()` | `req.hostname`、`req.url` 是否能打印。 |
| `GET /session` | `@Session()` | `session.count` 是否递增，响应头是否出现 `Set-Cookie`。 |
| `GET /aaa/ddd` | `@Res()` | 使用原始 `res` 后，普通 `return` 是否不再自动作为响应体。 |
| `GET /aaa/eee` | `@Next()` | 是否先打印 `handler1`，再进入下一个 handler 打印 `handler2`。 |
| `GET /page` | `@Render()` | 是否渲染 `views/index.hbs`，并加载 `public/index.css`。 |
| 访问带 `@UseGuards()` / `@UseInterceptors()` 的路由 | AOP 装饰器 | 是否符合 Guard -> Interceptor before -> Handler -> Interceptor after。 |

## Version Differences

记录时间：

```text
2026-06-12
```

当前本地 Nest 版本在 L10 项目中为：

```text
@nestjs/core 11.1.26
@nestjs/common 11.1.26
@nestjs/platform-express 11.1.26
```

### `@Session()` 的本地差异

课程写法：

```ts
import * as session from 'express-session';
```

本地报错：

```text
TypeError: session is not a function
```

当前相关配置：

```text
express-session 1.19.0
module: nodenext
moduleResolution: nodenext
esModuleInterop: true
```

原因：

```text
express-session 是 CommonJS 包。
当前项目使用 nodenext / ESM 风格编译。
import * as session 在当前语义下可能拿到模块命名空间对象，而不是可调用函数。
```

当前推荐写法：

```ts
import session from 'express-session';
```

另外，课程如果只配置：

```ts
session({
  secret: 'wang',
  cookie: { maxAge: 100000 },
});
```

本地会出现警告：

```text
express-session deprecated undefined resave option; provide resave option
express-session deprecated undefined saveUninitialized option; provide saveUninitialized option
```

当前推荐补全：

```ts
session({
  secret: 'wang',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 100000 },
});
```

如果后续实际练习中某个装饰器行为和课程截图不同，需要补充：

```text
课程写法
本地报错或本地输出
当前版本
原因
当前推荐写法
```

## 和前面课程的关系

L4 学 Nest CLI 时，已经见过 `nest g controller/service/module/resource` 生成大量装饰器。

L5 学 HTTP 数据传输时，核心就是：

```text
@Get / @Post / @Param / @Query / @Body / @Headers / @UploadedFiles
```

L6 到 L8 学 IoC 和 Provider 时，核心是：

```text
@Module / @Controller / @Injectable / @Inject
```

L10 学 AOP 时，核心是：

```text
@UseGuards / @UseInterceptors / @UsePipes / @UseFilters
```

所以 L11 更像一次索引整理：

```text
前面零散用过的装饰器，现在统一归类。
```

## 常见误区

### 误区一：装饰器会直接执行业务逻辑

不准确。

多数装饰器只是写入元数据。

Nest 在启动或请求运行时读取这些元数据，再决定怎么创建对象、注册路由、提取参数、挂载 AOP 组件。

### 误区二：所有装饰器都能随便放

不对。

装饰器有作用位置：

```text
@Module() 放 class 上。
@Get() 放 method 上。
@Param() 放 method parameter 上。
@Inject() 可以放 property 或 constructor parameter 上。
```

位置错了，就不是这个装饰器设计的用法。

### 误区三：`@Injectable()` 等于全局可注入

不对。

`@Injectable()` 只是说明这个 class 适合被 Nest 容器管理。

还需要在 module 的 `providers` 里注册，或者通过 module import/export 进入当前可见范围。

### 误区四：参数装饰器负责校验

不准确。

参数装饰器负责取值。

校验和转换通常交给 Pipe。

### 误区五：`@SetMetadata()` 本身就能完成权限控制

不对。

`@SetMetadata()` 只是写入元数据。

权限判断通常还需要 Guard + Reflector。

## Minimal Reproduction

1. 沿用 `L10/aop-test`，或创建 `L11/decorators-demo`。
2. 新增一个 Controller，使用 `@Controller()`、`@Get()`、`@Param()`、`@Query()`、`@Headers()`。
3. 请求 `GET /decorators/123?type=vip`。
4. 确认返回值来自 path params、query string、headers。
5. 再给某个 handler 加 `@UseGuards()` 或 `@UseInterceptors()`，观察触发顺序。

## 本节检查清单

- [ ] 能说明装饰器在 Nest 中主要用于写入框架元信息。
- [ ] 能区分 class、method、parameter、property 装饰器。
- [ ] 能解释 `@Module()`、`@Controller()`、`@Injectable()` 的职责。
- [ ] 能列出常见 HTTP 路由装饰器。
- [ ] 能列出常见 HTTP 参数装饰器。
- [ ] 能说明 `@Session()` 依赖 session middleware，不能单独工作。
- [ ] 能解释 `connect.sid`、`Path`、`Expires`、`HttpOnly` 这些 Set-Cookie 字段从哪里来。
- [ ] 能说明 `@Res()` 默认会接管响应，以及 `@Res({ passthrough: true })` 和普通 `return` 的区别。
- [ ] 能说明 `@Next()` 调用 `next()` 后会进入下一个匹配处理器，当前 handler 的 `return` 通常不作为响应体。
- [ ] 能说明 `@Render()` 需要配置静态资源目录、模板目录和模板引擎，且 `return` 对象会作为模板数据。
- [ ] 能说明参数装饰器和 Pipe 的分工。
- [ ] 能说明 AOP 相关装饰器的作用。
- [ ] 能解释 `@Inject()` 和 Provider token 的关系。
- [ ] 能说明 `@SetMetadata()` 只是写入 metadata，不直接执行业务逻辑。
- [ ] 能把一个请求和它经过的装饰器对应起来。

## 参考资料

- Nest 官方文档：Controllers：https://docs.nestjs.com/controllers
- Nest 官方文档：Modules：https://docs.nestjs.com/modules
- Nest 官方文档：Providers：https://docs.nestjs.com/providers
- Nest 官方文档：Custom decorators：https://docs.nestjs.com/custom-decorators
- Nest 官方文档：OpenAPI decorators：https://docs.nestjs.com/openapi/decorators

## 下一步

1. 如果课程继续讲自定义装饰器，则重点观察 `createParamDecorator` 和 `SetMetadata`。
2. 如果进入 ExecutionContext / Metadata / Reflector，则回头关联本节的参数装饰器和 metadata 装饰器。

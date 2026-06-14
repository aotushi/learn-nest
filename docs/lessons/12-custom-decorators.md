# 12 自定义装饰器

## 本节目标

这一节从 L11 的“认识 Nest 内置装饰器”进入“自己封装装饰器”。

学完本节，需要能写出并解释：

1. 用 `SetMetadata()` 封装 `@Roles()`。
2. 用 `Reflector` 在 Guard 中读取 metadata。
3. 用 `applyDecorators()` 合并多个装饰器。
4. 用 `createParamDecorator()` 创建 `@CurrentUser()`。
5. 让自定义参数装饰器接收参数，例如 `@CurrentUser('id')`。
6. 自定义参数装饰器和 Pipe / `ValidationPipe` 的关系。

## 规范检查：本节不应该压缩

仓库规范 `docs/course-note-guidelines.md` 的要求是：

```text
Avoid over-compressing a lesson into abstract concepts only.
Every course example in the inventory must have a corresponding place in the note.
Runtime examples should live next to the concept they explain.
```

所以本节不应该只写概念摘要。正确笔记形态应该是：

```text
业务场景
完整代码
使用方式
请求示例
预期响应
运行链路
常见坑
```

Nest 官方 Custom decorators 文档也按这些机制展开：

```text
custom route decorators
param decorators
passing data
working with pipes
decorator composition
```

## 课程主线

```text
内置装饰器已经能表达 Nest 行为
  -> 业务代码里开始反复写相同的 metadata / Guard / Swagger / request.user 提取逻辑
  -> 自定义装饰器把重复写法封装成业务语言
  -> Controller 只保留“这个接口需要什么能力”的声明
```

一句话：

```text
自定义装饰器不是新机制，而是把 Nest 已有装饰器能力包装成更清晰的业务 API。
```

## 1. 封装 `SetMetadata()`：自定义方法装饰器

### 业务场景

后台文章创建接口只允许管理员访问。

不封装时可以直接写：

```ts
@Post('create')
@SetMetadata('roles', ['admin'])
create() {
  return '只有管理员能创建文章';
}
```

这个写法能工作，但业务语义不够清楚：

```text
'roles' 是权限系统约定，不应该散落在 Controller 里。
['admin'] 会被哪个 Guard 读取，Controller 里看不出来。
字符串 key 容易拼错。
```

更好的做法是封装成 `@Roles()`。

### `src/decorators/roles.decorator.ts`

```ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

这段代码的含义：

```text
ROLES_KEY：统一 metadata key，避免到处手写 'roles'。
Roles(...roles)：接收一个或多个角色。
SetMetadata(ROLES_KEY, roles)：把角色数组写到当前 class 或 handler 的 metadata 上。
```

### 使用方式

```ts
import { Controller, Post } from '@nestjs/common';
import { Roles } from './decorators/roles.decorator';

@Controller('articles')
export class ArticlesController {
  @Post('create')
  @Roles('admin', 'super_admin')
  create() {
    return '只有管理员能创建文章';
  }
}
```

请求：

```text
POST /articles/create
```

注意：

```text
@Roles() 本身不会拦截请求。
它只是写 metadata。
如果没有 Guard 读取这个 metadata，任何角色仍然都能访问。
```

所以 `@Roles()` 必须配合 Guard 才有权限效果。

## 2. 用 Guard 消费 `@Roles()` 写入的 metadata

### 业务场景

`@Roles('admin')` 只是声明“这个接口需要 admin 角色”。真正判断用户有没有角色，需要 Guard。

### `src/guards/roles.guard.ts`

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}
```

关键点：

```text
Reflector：Nest 提供的 metadata 读取工具。
context.getHandler()：当前路由处理函数。
context.getClass()：当前 Controller class。
getAllAndOverride()：先读 handler，再读 class，method 级配置可以覆盖 class 级配置。
request.user：通常由认证 Guard、Passport strategy 或 middleware 写入。
```

### 为什么要同时读 handler 和 class

Controller 级角色：

```ts
@Controller('admin')
@Roles('admin')
export class AdminController {}
```

方法级角色：

```ts
@Post('create')
@Roles('super_admin')
create() {
  return 'created';
}
```

如果 Guard 只读 `context.getHandler()`：

```text
只能读到 method 上的 @Roles()。
读不到 Controller class 上的 @Roles()。
```

如果 Guard 只读 `context.getClass()`：

```text
只能读到 Controller 上的 @Roles()。
读不到 method 上更具体的配置。
```

所以课程项目里更推荐：

```ts
this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
  context.getHandler(),
  context.getClass(),
]);
```

### 触发链路

```text
请求进入 POST /articles/create
  -> JwtAuthGuard 或 MockAuthGuard 先把用户写到 request.user
  -> RolesGuard 执行
  -> Reflector 读取 handler / class 上的 ROLES_KEY
  -> 拿到 ['admin', 'super_admin']
  -> 从 request.user.roles 取当前用户角色
  -> 匹配成功则执行 create()
  -> 匹配失败则返回 403
```

## 3. 本地最小认证 Guard：先模拟 `request.user`

### 业务场景

如果本节还没接 JWT，可以先写一个假的登录 Guard。它不校验 token，只负责把用户对象挂到 `request.user`，方便验证自定义装饰器和角色 Guard。

### `src/guards/mock-auth.guard.ts`

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    request.user = {
      id: 1,
      username: 'demo',
      roles: ['admin'],
    };

    return true;
  }
}
```

这段代码的作用：

```text
模拟认证成功。
给 request.user 写入当前登录用户。
让 @CurrentUser() 和 RolesGuard 有数据可读。
```

### 使用 `MockAuthGuard` + `RolesGuard`

```ts
import { Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from './decorators/roles.decorator';
import { MockAuthGuard } from './guards/mock-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('articles')
@UseGuards(MockAuthGuard, RolesGuard)
export class ArticlesController {
  @Post('create')
  @Roles('admin')
  create() {
    return 'created';
  }
}
```

请求：

```text
POST /articles/create
```

预期响应：

```text
created
```

如果把 `MockAuthGuard` 中的角色改成：

```ts
roles: ['user'],
```

再请求：

```text
POST /articles/create
```

预期结果：

```text
403 Forbidden
```

## 4. 合并多个装饰器：`applyDecorators()`

### 业务场景

真实项目中，一个后台接口可能每次都要写：

```ts
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
```

如果每个接口都重复写，Controller 很快变得臃肿。

`applyDecorators()` 可以把多个装饰器合成一个业务装饰器。

### 重复写法

```ts
import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('admin')
export class AdminController {
  @Post('create')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  create() {
    return 'created';
  }
}
```

问题：

```text
每个接口都要重复三行。
每个接口都要关心认证、授权、Swagger 的细节。
某个接口漏写一个装饰器就会出现行为不一致。
```

### `src/decorators/auth.decorator.ts`

```ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

export function Auth(...roles: string[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
  );
}
```

如果本地还没有 JWT，可以先用 `MockAuthGuard`：

```ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { MockAuthGuard } from '../guards/mock-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

export function Auth(...roles: string[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(MockAuthGuard, RolesGuard),
  );
}
```

### 使用方式：方法级

```ts
import { Controller, Post } from '@nestjs/common';
import { Auth } from './decorators/auth.decorator';

@Controller('admin')
export class AdminController {
  @Post('create')
  @Auth('admin')
  create() {
    return 'created';
  }
}
```

请求：

```text
POST /admin/create
```

效果等价于：

```ts
@Post('create')
@Roles('admin')
@UseGuards(MockAuthGuard, RolesGuard)
create() {
  return 'created';
}
```

### 使用方式：类级

```ts
import { Controller, Get, Post } from '@nestjs/common';
import { Auth } from './decorators/auth.decorator';

@Controller('admin')
@Auth('admin')
export class AdminController {
  @Get('profile')
  profile() {
    return 'admin profile';
  }

  @Post('create')
  create() {
    return 'created';
  }
}
```

含义：

```text
AdminController 下的所有 handler 都会应用 @Auth('admin')。
如果只有少数接口需要不同角色，再在 method 上覆盖或拆开写。
```

### `applyDecorators()` 的边界

`applyDecorators()` 适合组合常见的 class / method 装饰器：

```text
@Roles()
@UseGuards()
@UseInterceptors()
@UsePipes()
@UseFilters()
部分 Swagger 装饰器
```

但不是所有第三方装饰器都能组合。Nest 官方文档特别提醒：

```text
@nestjs/swagger 的 @ApiHideProperty() 不能通过 applyDecorators() 正常组合。
```

所以遇到第三方装饰器时，要查文档或本地验证。

## 5. 通过 `createParamDecorator()` 创建自定义参数装饰器

### 业务场景

认证层通常会把当前登录用户挂到 `request.user`。

如果每个 Controller 都写：

```ts
@Get('profile')
profile(@Req() request: Request) {
  return request.user;
}
```

问题是：

```text
Controller 暴露了底层 request 对象。
每个接口都重复 request.user。
业务代码被框架细节污染。
```

可以封装成 `@CurrentUser()`。

### `src/decorators/current-user.decorator.ts`

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

这段代码的含义：

```text
createParamDecorator()：创建参数装饰器。
data：调用装饰器时传入的参数，例如 @CurrentUser('id') 中的 'id'。
ctx：当前执行上下文。
ctx.switchToHttp().getRequest()：切换到 HTTP 上下文并获取 request。
request.user：认证层挂载的当前用户。
data ? user?.[data] : user：有字段名就返回字段，否则返回整个 user。
```

### 使用方式：取整个用户

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { MockAuthGuard } from './guards/mock-auth.guard';

@Controller()
@UseGuards(MockAuthGuard)
export class AppController {
  @Get('profile')
  profile(@CurrentUser() user: any) {
    return user;
  }
}
```

请求：

```text
GET /profile
```

预期响应：

```json
{
  "id": 1,
  "username": "demo",
  "roles": ["admin"]
}
```

响应来源：

```text
MockAuthGuard 写入 request.user。
CurrentUser 从 request.user 读取整个对象。
handler return user。
Nest 把返回对象序列化为 JSON。
```

### 使用方式：取用户字段

```ts
@Get('profile/id')
profileId(@CurrentUser('id') userId: number) {
  return userId;
}
```

请求：

```text
GET /profile/id
```

预期响应：

```json
1
```

触发链路：

```text
@CurrentUser('id')
  -> data 是 'id'
  -> request.user 是 { id: 1, username: 'demo', roles: ['admin'] }
  -> 返回 request.user['id']
  -> handler 参数 userId 得到 1
```

### 同一个 handler 中同时取整个用户和字段

```ts
@Get('profile/detail')
detail(
  @CurrentUser() user: any,
  @CurrentUser('id') userId: number,
) {
  return {
    user,
    userId,
  };
}
```

请求：

```text
GET /profile/detail
```

预期响应：

```json
{
  "user": {
    "id": 1,
    "username": "demo",
    "roles": ["admin"]
  },
  "userId": 1
}
```

## 6. `ExecutionContext` 在参数装饰器里的作用

`createParamDecorator()` 的回调不是直接收到 `request`，而是收到 `ExecutionContext`。

```ts
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

原因：

```text
Nest 不只支持 HTTP。
同一套上下文抽象也要服务 WebSocket、RPC、GraphQL。
ExecutionContext 让装饰器可以按当前传输层取数据。
```

HTTP 场景常用：

```ts
const request = ctx.switchToHttp().getRequest();
const response = ctx.switchToHttp().getResponse();
```

如果以后进入 GraphQL，上下文获取方式会不同，这里先只记 HTTP 写法。

## 7. 自定义参数装饰器和 Pipe

### 业务场景

`@CurrentUser('id')` 取出来的值可能是字符串，也可能是数字。

TypeScript 里的参数类型：

```ts
profileId(@CurrentUser('id') userId: number) {}
```

不会自动把运行时值转换成 number。

如果需要转换，可以配 Pipe。

### 配合 `ParseIntPipe`

```ts
import { Controller, Get, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { MockAuthGuard } from './guards/mock-auth.guard';

@Controller()
@UseGuards(MockAuthGuard)
export class AppController {
  @Get('profile/id-plus-one')
  idPlusOne(@CurrentUser('id', ParseIntPipe) userId: number) {
    return userId + 1;
  }
}
```

如果 `request.user.id` 是：

```ts
id: '1',
```

请求：

```text
GET /profile/id-plus-one
```

预期响应：

```json
2
```

### 配合 `ValidationPipe`

官方文档有一个重要提醒：

```text
ValidationPipe 默认不会校验自定义参数装饰器拿到的参数。
```

如果要让它校验，需要开启：

```ts
new ValidationPipe({
  validateCustomDecorators: true,
});
```

例如全局配置：

```ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      validateCustomDecorators: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

记忆方式：

```text
显式挂到参数上的 Pipe 可以执行。
ValidationPipe 默认不主动校验自定义参数装饰器。
需要 validateCustomDecorators: true。
```

## 8. 完整最小示例串联

下面是一组可以放进 `L12/custom-decorator-demo` 的最小代码。

### `src/decorators/roles.decorator.ts`

```ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### `src/decorators/current-user.decorator.ts`

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

### `src/guards/mock-auth.guard.ts`

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    request.user = {
      id: 1,
      username: 'demo',
      roles: ['admin'],
    };

    return true;
  }
}
```

### `src/guards/roles.guard.ts`

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}
```

### `src/decorators/auth.decorator.ts`

```ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { MockAuthGuard } from '../guards/mock-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

export function Auth(...roles: string[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(MockAuthGuard, RolesGuard),
  );
}
```

### `src/app.controller.ts`

```ts
import { Controller, Get, Post } from '@nestjs/common';
import { Auth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller()
export class AppController {
  @Get('profile')
  @Auth('admin')
  profile(@CurrentUser() user: any) {
    return user;
  }

  @Get('profile/id')
  @Auth('admin')
  profileId(@CurrentUser('id') userId: number) {
    return userId;
  }

  @Post('articles/create')
  @Auth('admin')
  create() {
    return 'created';
  }
}
```

### `src/app.module.ts`

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
})
export class AppModule {}
```

这里没有把 `MockAuthGuard` 和 `RolesGuard` 放进 `providers`：

```text
因为 @UseGuards(MockAuthGuard, RolesGuard) 直接传 class 时，Nest 可以实例化它们。
如果 Guard 依赖其他 provider，或者要复用实例，建议注册到 providers。
```

如果要更标准，可以写：

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MockAuthGuard } from './guards/mock-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AppController],
  providers: [MockAuthGuard, RolesGuard],
})
export class AppModule {}
```

## 9. 请求自测

### 获取当前用户

请求：

```text
GET /profile
```

预期响应：

```json
{
  "id": 1,
  "username": "demo",
  "roles": ["admin"]
}
```

链路：

```text
@Auth('admin')
  -> Roles('admin')
  -> UseGuards(MockAuthGuard, RolesGuard)
MockAuthGuard 写入 request.user
RolesGuard 读取 roles metadata 并判断角色
@CurrentUser() 读取 request.user
handler 返回 user
```

### 获取当前用户 id

请求：

```text
GET /profile/id
```

预期响应：

```json
1
```

链路：

```text
@CurrentUser('id')
  -> data = 'id'
  -> user = request.user
  -> return user['id']
```

### 创建文章

请求：

```text
POST /articles/create
```

预期响应：

```text
created
```

如果 `MockAuthGuard` 改成：

```ts
roles: ['user'],
```

预期结果：

```text
403 Forbidden
```

## 10. 三类自定义装饰器对比

| 类型 | API | 使用位置 | 解决的问题 | 消费者 |
| --- | --- | --- | --- | --- |
| 元数据装饰器 | `SetMetadata()` | class / method | 声明业务元数据 | `Reflector` / Guard |
| 组合装饰器 | `applyDecorators()` | class / method | 合并多个装饰器 | Nest 扫描器与各装饰器消费者 |
| 参数装饰器 | `createParamDecorator()` | parameter | 从上下文提取参数 | handler 参数系统 / Pipe |

对应到本节代码：

```text
@Roles()：声明接口需要哪些角色。
@Auth()：组合角色、认证 Guard、权限 Guard。
@CurrentUser()：从 request.user 提取当前用户。
```

## 常见问题与修复

### `@Roles()` 写了但没有权限效果

原因：

```text
@Roles() 只写 metadata。
没有 RolesGuard 读取 metadata，就不会发生权限判断。
```

修复：

```text
实现 RolesGuard。
用 @UseGuards(RolesGuard) 或组合进 @Auth()。
确认 Guard 里读取的 key 和 SetMetadata 写入的 key 一致。
```

### `Reflector` 读取不到 roles

常见原因：

```text
SetMetadata 使用的 key 和 Reflector 读取的 key 不一致。
装饰器挂在 class 上，但 Guard 只读了 handler。
装饰器挂在 method 上，但 Guard 只读了 class。
```

推荐写法：

```ts
this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
  context.getHandler(),
  context.getClass(),
]);
```

### `@CurrentUser()` 返回 `undefined`

常见原因：

```text
请求进入 handler 前，没有任何认证逻辑写入 request.user。
Guard 执行顺序不对。
当前路由没有挂 MockAuthGuard / JwtAuthGuard。
```

修复：

```text
先确认 Guard 是否执行。
在 Guard 中给 request.user 写入测试对象。
再请求 @CurrentUser() 对应接口。
```

### `@CurrentUser('id')` 类型不符合预期

原因：

```text
request.user.id 可能是字符串。
TypeScript 参数标注不会做运行时转换。
```

修复：

```text
使用 ParseIntPipe。
或者在认证层统一构造 user 对象时保证类型。
```

### `ValidationPipe` 没校验自定义参数装饰器

原因：

```text
ValidationPipe 默认不校验自定义装饰器提取出的参数。
```

修复：

```ts
new ValidationPipe({
  validateCustomDecorators: true,
});
```

## Version Differences

记录时间：

```text
2026-06-13
```

需要在实际 L12 项目中补齐：

```text
@nestjs/common:
@nestjs/core:
@nestjs/platform-express:
@nestjs/swagger:
```

本节已知版本点：

```text
Nest 10/11 中 SetMetadata、createParamDecorator、applyDecorators 的基础用法一致。
@nestjs/swagger 的部分装饰器不能通过 applyDecorators() 正常组合。
ValidationPipe 默认不校验自定义参数装饰器参数，需要 validateCustomDecorators: true。
```

## Commands

如果创建独立练习项目：

```bash
nest new custom-decorator-demo
pnpm add @nestjs/swagger
```

如果沿用当前项目：

```text
记录实际使用的 L12 项目目录和启动命令。
```

## Generated Files

建议本地实践文件：

```text
L12/custom-decorator-demo/src/decorators/roles.decorator.ts
L12/custom-decorator-demo/src/decorators/auth.decorator.ts
L12/custom-decorator-demo/src/decorators/current-user.decorator.ts
L12/custom-decorator-demo/src/guards/mock-auth.guard.ts
L12/custom-decorator-demo/src/guards/roles.guard.ts
L12/custom-decorator-demo/src/app.controller.ts
L12/custom-decorator-demo/src/app.module.ts
```

课程真实生成命令和文件按学习过程补齐。

## Minimal Reproduction

1. 创建或进入 `L12/custom-decorator-demo`。
2. 新增 `Roles`、`Auth`、`CurrentUser` 三个装饰器。
3. 新增 `MockAuthGuard`，在请求上写入 `request.user`。
4. 新增 `RolesGuard`，用 `Reflector` 读取 `ROLES_KEY`。
5. 在 Controller 中写 `@Auth('admin')` 和 `@CurrentUser()`。
6. 请求 `GET /profile`，确认能返回当前用户。
7. 请求 `POST /articles/create`，确认角色符合时放行，不符合时拒绝。

## 运行自测索引

主要解释已经放在对应概念旁边，这里只保留快速检查表。

| Request or command | Concept | What to check |
| --- | --- | --- |
| `GET /profile` | `@CurrentUser()` | 返回值是否来自 `request.user` |
| `GET /profile/id` | `@CurrentUser('id')` | 是否只返回当前用户 id |
| `POST /articles/create` | `@Roles()` + `RolesGuard` | Guard 是否读取到 roles metadata |
| `POST /admin/create` | `@Auth()` | 是否一次性应用角色和 Guard |
| 使用 `ParseIntPipe` | custom decorator + Pipe | 字符串 id 是否被转换 |
| 使用 `ValidationPipe` | custom decorator + validation | 是否配置 `validateCustomDecorators: true` |

## 本节检查清单

- [ ] 能说明自定义装饰器只是封装已有 Nest 装饰器机制。
- [ ] 能说明 `SetMetadata()` 只写 metadata，不执行权限判断。
- [ ] 能说明 `RolesGuard` 如何通过 `Reflector` 消费 metadata。
- [ ] 能说明 `applyDecorators()` 用来合并 class/method 装饰器。
- [ ] 能说明 `@Auth()` 这类组合装饰器适合放 class 或 method 上。
- [ ] 能说明 `createParamDecorator()` 的回调参数含义。
- [ ] 能通过 `ExecutionContext` 拿到 HTTP request。
- [ ] 能解释 `@CurrentUser()` 和 `@CurrentUser('id')` 的区别。
- [ ] 能说明 `request.user` 必须由认证层提前写入。
- [ ] 能说明自定义参数装饰器与 Pipe 的关系。
- [ ] 能记住 `ValidationPipe` 默认不校验自定义装饰器参数。
- [ ] 能说出 `applyDecorators()` 对某些第三方装饰器存在兼容边界。

## 参考资料

- Nest 官方文档：Custom decorators：https://docs.nestjs.com/custom-decorators
- Nest 官方文档：Guards：https://docs.nestjs.com/guards
- Nest 官方文档：Execution context：https://docs.nestjs.com/fundamentals/execution-context
- Nest 官方文档：OpenAPI decorators：https://docs.nestjs.com/openapi/decorators

## 下一步

1. 按课程实际代码创建 `L12/custom-decorator-demo`。
2. 把真实命令、文件路径、请求输出补回“课程示例清单”和“运行自测索引”。
3. 如果后续进入 Metadata / Reflector / RBAC，本节的 `@Roles()` 和 `@Auth()` 可以作为鉴权主线的前置笔记。

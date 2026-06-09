# 06 IoC 解决了什么痛点问题？

## 本节目标

这一节的重点不是多写几个接口，而是理解 Nest 为什么要有 `Module`、`Controller`、`Provider`、`Injectable`、`imports`、`exports` 这些看起来有点重的结构。

学完这一节，需要能回答：

1. 后端项目里为什么会出现复杂的对象依赖关系？
2. IoC 和 DI 分别是什么意思？
3. Nest 是如何把 Controller、Service 等对象创建并组装起来的？
4. `controllers`、`providers`、`imports`、`exports` 各自解决什么问题？
5. 为什么跨模块使用 Service 时，通常要通过模块的 `exports` 暴露？

## 先看没有 IoC 的痛点

后端应用里通常不只有一个对象。

常见对象关系大概是：

```text
Controller -> Service -> Repository -> DataSource -> Config
```

含义：

- `Controller` 接收请求，调用业务逻辑。
- `Service` 组织业务逻辑。
- `Repository` 负责数据访问。
- `DataSource` 维护数据库连接。
- `Config` 提供数据库账号、密码、端口等配置。

如果没有框架帮忙，代码可能会变成这样：

```ts
const config = new Config();
const dataSource = new DataSource(config);
const repository = new CatRepository(dataSource);
const catsService = new CatsService(repository);
const catsController = new CatsController(catsService);
```

这类代码的问题不在于 `new` 本身，而在于依赖图变大以后会很难维护：

- 需要手动判断谁先创建、谁后创建。
- 需要手动把依赖传给下一个对象。
- 需要避免重复创建本该复用的对象。
- 测试时要手动替换依赖。
- 一旦中间依赖变了，上层创建代码也容易跟着改。

后端项目越大，这个问题越明显。

## IoC 是什么

IoC 是 Inversion of Control，通常翻译为控制反转。

它反转的是“对象创建和依赖组装”的控制权：

| 写法 | 控制权在谁手里 | 特点 |
| --- | --- | --- |
| 手动 `new` | 业务代码自己 | 自己创建依赖，自己组装对象 |
| IoC 容器 | 框架容器 | 业务代码声明依赖，容器负责创建和注入 |

可以先用一句话记：

**以前是我主动创建依赖；现在是我声明需要什么，框架把依赖注入进来。**

Nest 里的 IoC 容器会在应用启动时读取模块和类上的元信息，创建对象实例，并把依赖关系组装好。

## DI 是什么

DI 是 Dependency Injection，依赖注入。

IoC 是思想，DI 是实现这种思想的常见方式。

在 Nest 中，最常见的是构造器注入：

```ts
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}
}
```

这段代码里没有手动写：

```ts
new CatsService()
```

`CatsController` 只是声明：我需要一个 `CatsService`。

真正创建 `CatsService`、创建 `CatsController`、把 service 传给 controller 的工作，由 Nest 的 IoC 容器完成。

## Nest 里的三类关键角色

### Controller

`Controller` 负责接收请求并返回响应。

```ts
@Controller('cats')
export class CatsController {}
```

`@Controller()` 的作用不只是声明路由前缀，也是在告诉 Nest：这个类是一个控制器，应该被纳入模块管理。

Controller 通常会依赖 Service，但一般不作为普通业务依赖暴露给别的对象使用。

### Provider

Provider 是可以被 Nest 容器管理和注入的对象。

最常见的 provider 是 service：

```ts
@Injectable()
export class CatsService {}
```

`@Injectable()` 表示这个类可以交给 Nest 容器创建，也可以被注入到别的对象里。

后续还会学到更多 provider 写法，比如 class provider、value provider、factory provider、alias provider。这些属于第 8 节之后的重点。

### `@Controller()` 和 `@Injectable()` 的区别

`Controller` 和 `Injectable` 都不是 TypeScript 关键字，它们都是 Nest 提供的装饰器函数。

区别不是“一个是装饰器，一个是声明”，而是：

```text
装饰器语法：@Controller() / @Injectable()
表达的声明：这个 class 在 Nest 里扮演什么角色
```

对比：

| 写法 | 角色 | 能接收依赖注入？ | 通常是否作为依赖给别人用？ | 主要职责 |
| --- | --- | --- | --- | --- |
| `@Controller()` | Controller | 可以 | 通常不这么做 | 接收 HTTP 请求，调用 Service，返回响应 |
| `@Injectable()` | Provider | 可以 | 可以 | 提供业务逻辑、数据访问、工具能力 |

更具体一点：

```ts
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}
}
```

这里的 `CatsController` 可以接收依赖注入，也就是 `CatsService` 被注入进来。

但通常不会反过来把 `CatsController` 注入到 `CatsService` 里：

```ts
@Injectable()
export class CatsService {
  // 不推荐：Service 不应该反向依赖 Controller。
  constructor(private readonly catsController: CatsController) {}
}
```

Controller 是入口层，负责接请求；Service 是能力层，负责被 Controller 或其他 Service 复用。

所以初学时可以先记：

```text
Controller：可以接收依赖，但通常不作为依赖被别人复用。
Injectable/Provider：可以接收依赖，也通常可以作为依赖被别人复用。
```

### Module

`Module` 是 Nest 组织代码和依赖边界的单位。

本项目当前的 `CatsModule`：

```ts
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

可以这样理解：

- `controllers`：这个模块负责哪些控制器。
- `providers`：这个模块内部有哪些可注入对象。
- `imports`：这个模块依赖哪些其他模块。
- `exports`：这个模块允许外部模块使用哪些 provider。

## 本项目里的 IoC 关系

当前项目已经有一个很典型的 IoC 结构。

`AppModule` 引入 `CatsModule`：

```ts
@Module({
  imports: [CatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

`CatsModule` 管理 `CatsController` 和 `CatsService`：

```ts
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

`CatsController` 通过构造器拿到 `CatsService`：

```ts
constructor(private readonly catsService: CatsService) {}
```

这条链路可以画成：

```text
AppModule
  imports CatsModule

CatsModule
  controllers: CatsController
  providers: CatsService

CatsController
  depends on CatsService
```

应用启动时，Nest 从根模块开始解析这棵结构，然后创建并组装对象。

## `imports` 和 `exports` 的边界

模块之间不是随便互相拿 service。

假设有一个 `OtherModule`：

```ts
@Module({
  providers: [OtherService],
  exports: [OtherService],
})
export class OtherModule {}
```

如果 `AppModule` 想使用 `OtherService`，需要先导入 `OtherModule`：

```ts
@Module({
  imports: [OtherModule],
})
export class AppModule {}
```

这里有两个动作：

1. `OtherModule` 通过 `exports` 明确暴露 `OtherService`。
2. `AppModule` 通过 `imports` 明确引入 `OtherModule`。

这样做的价值是模块边界清楚：

- 模块内部 provider 默认只服务于当前模块。
- 只有被 `exports` 的 provider，才是模块对外提供的能力。
- 其他模块通过 `imports` 建立依赖关系。

这比把所有 service 都丢进一个全局列表更可控。

## 构造器注入和属性注入

Nest 支持多种注入方式，初学阶段优先掌握构造器注入。

推荐写法：

```ts
constructor(private readonly catsService: CatsService) {}
```

这种写法的优点：

- 依赖在类创建时就明确。
- TypeScript 会自动生成并初始化成员属性。
- 测试时更容易看出这个类需要哪些依赖。
- 依赖不会在类内部突然出现。

属性注入也能做到类似效果：

```ts
@Inject(CatsService)
private readonly catsService: CatsService;
```

但一般不作为初学阶段的默认写法。除非有特殊场景，否则先用构造器注入。

## 容器不是为了少写代码

IoC 容器的价值不是简单地少写几行 `new`。

真正价值在于：

- 统一管理对象生命周期。
- 自动维护依赖创建顺序。
- 让对象之间通过声明依赖协作。
- 让模块边界变清楚。
- 让测试替换依赖更容易。
- 让大型后端项目可以继续拆模块。

所以 Nest 的模块和 provider 机制刚开始会显得啰嗦，但它解决的是后端项目规模变大后的组织问题。

## 和前面课程的关系

第 4 节学的是 CLI：

- CLI 生成 module、controller、service。
- 这一节解释为什么生成出来的代码要这样组织。

第 5 节学的是 HTTP 数据传输：

- Controller 负责接 HTTP 请求。
- 这一节解释 Controller 为什么可以直接拿到 Service。

后续第 8 节会继续深入 provider：

- 同一个 token 可以对应不同对象。
- provider 不一定只能是 class。
- 注入可以变得更灵活。

## 本项目实践建议

这一节可以先不急着新增业务接口，重点观察现有代码：

```text
src/app.module.ts
src/app.controller.ts
src/app.service.ts
src/cats/cats.module.ts
src/cats/cats.controller.ts
src/cats/cats.service.ts
```

建议做三个小检查：

1. `CatsService` 是否在 `CatsModule.providers` 中注册。
2. `CatsController` 是否在 `CatsModule.controllers` 中注册。
3. `CatsController` 是否通过构造器声明了对 `CatsService` 的依赖。

如果要跟着课程做跨模块注入练习，可以新建一个临时 `OtherModule` 和 `OtherService`，观察：

```bash
pnpm nest g module other
pnpm nest g service other --no-spec
```

练习完成后再决定是否保留。当前仓库原则是 `src/` 保持最新课程代码，不为每节课堆历史目录。

## 常见误区

### 误区一：`@Injectable()` 等于“自动全局可用”

不是。

`@Injectable()` 只是说明这个类可以被容器管理。它还需要出现在某个 module 的 `providers` 中，或者通过其他 provider 注册方式进入容器。

错误理解：

```ts
@Injectable()
export class CatsService {}

@Module({
  controllers: [CatsController],
  providers: [],
})
export class CatsModule {}
```

上面这种写法里，`CatsService` 虽然有 `@Injectable()`，但没有注册到 `providers`，`CatsController` 不能直接注入它。

正确写法：

```ts
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

### 误区二：一个模块 import 了另一个模块，就能拿到里面所有 service

不是。

只能拿到对方 `exports` 出来的 provider。没有 export 的 provider 仍然是对方模块的内部细节。

错误理解：

```ts
@Module({
  providers: [OtherService],
})
export class OtherModule {}

@Module({
  imports: [OtherModule],
  providers: [AppService],
})
export class AppModule {}
```

`AppModule` 虽然 import 了 `OtherModule`，但 `OtherModule` 没有 export `OtherService`，所以 `AppService` 不能稳定地注入 `OtherService`。

正确写法：

```ts
@Module({
  providers: [OtherService],
  exports: [OtherService],
})
export class OtherModule {}

@Module({
  imports: [OtherModule],
  providers: [AppService],
})
export class AppModule {}
```

### 误区三：Controller 和 Service 的方法名决定注入

不是。

注入看的是类型或 token，不看方法名。方法名只是普通 TypeScript 方法名。

下面两个方法名都只是普通方法名：

```ts
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  findAll() {
    return this.catsService.findAll();
  }
}
```

真正让 `catsService` 被注入的，是构造器参数里的类型信息：

```ts
constructor(private readonly catsService: CatsService) {}
```

不是 `findAll` 这个方法名。

### 误区四：IoC 只是后端框架的高级概念，暂时不用懂

不是。

Nest 的基础代码每天都在用 IoC。只要写了 `constructor(private readonly xxxService: XxxService)`，你就在使用依赖注入。

例如：

```ts
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}
}
```

这段代码的意思是：

```text
CatsController 声明自己需要 CatsService。
Nest 容器负责创建 CatsService。
Nest 容器负责把 CatsService 注入 CatsController。
```

## 这一节真正要记住的东西

Nest 应用启动后，不是靠我们手动 `new Controller`、`new Service` 来组装项目。

它会从根模块开始读取模块配置和类装饰器信息：

- `@Module()` 描述模块有哪些 controller、provider，以及依赖哪些模块。
- `@Controller()` 描述控制器。
- `@Injectable()` 描述可注入的 provider。
- 构造器参数描述当前类依赖谁。

然后 Nest 的 IoC 容器负责创建对象、维护依赖顺序、注入依赖。

一句话总结：

**IoC 解决的是大型后端项目里对象多、依赖多、手动创建和组装容易失控的问题；DI 是 Nest 落地 IoC 的主要方式。**

## 下一步

1. 进入第 7 节，学习如何调试 Nest 项目。
2. 回头观察 `CatsController -> CatsService` 的依赖注入链路。
3. 第 8 节再重点补 provider 的多种注册和注入方式。

# 08 使用多种 Provider，灵活注入对象

## 本节目标

这一节继续接第 6 节的 IoC / DI。

第 6 节解决的是：

```text
为什么对象不应该都由自己手动 new？
```

第 8 节解决的是：

```text
同样是交给 Nest 容器创建对象，能不能更灵活地决定“注入什么”？
```

学完这一节，需要能回答：

1. `providers: [CatsService]` 的完整写法是什么？
2. `provide` 是什么，为什么它也叫 token？
3. `useClass`、`useValue`、`useFactory`、`useExisting` 分别适合什么场景？
4. 为什么自定义 token 时经常需要 `@Inject()`？
5. class、字符串、symbol 作为 token 有什么差别？
6. Provider 的本质是不是只有 Service？

## Provider 不是只能写 Service

在 Nest 里，Provider 是一个更宽泛的概念。

常见的 `CatsService` 只是 Provider 的一种最常见形式：

```ts
@Module({
  providers: [CatsService],
})
export class CatsModule {}
```

这个写法是简写，完整写法接近：

```ts
@Module({
  providers: [
    {
      provide: CatsService,
      useClass: CatsService,
    },
  ],
})
export class CatsModule {}
```

也就是说：

```text
providers: [CatsService]
```

可以理解为告诉 Nest：

```text
当别人需要 CatsService 这个 token 时，用 CatsService 这个类创建实例。
```

这里有两个角色：

| 角色 | 含义 |
| --- | --- |
| `provide` | 注入 token，也就是“别人用什么名字来要这个依赖” |
| `useClass` / `useValue` / `useFactory` / `useExisting` | 创建或返回依赖的方式 |

## token 是什么

token 是 Nest 容器查找依赖时用的 key。

默认情况下，类本身就可以当 token：

```ts
constructor(private readonly catsService: CatsService) {}
```

这里 Nest 能通过类型元数据知道你要的是：

```ts
CatsService
```

所以会去容器里找 `CatsService` 这个 token 对应的 provider。

但如果 token 不是 class，比如字符串：

```ts
{
  provide: 'APP_NAME',
  useValue: 'learn-nest',
}
```

构造器参数的 TypeScript 类型信息就不够了，因为 `string` 不能说明你要的是哪个具体字符串 token。

这时就需要显式写：

```ts
constructor(@Inject('APP_NAME') private readonly appName: string) {}
```

一句话：

```text
class token 通常可以靠类型自动注入；
非 class token 通常要用 @Inject(token) 显式声明。
```

## 方式一：useClass

`useClass` 表示：**用某个类来创建实例。**

最常见的简写：

```ts
providers: [CatsService]
```

完整写法：

```ts
providers: [
  {
    provide: CatsService,
    useClass: CatsService,
  },
]
```

更有价值的场景是替换实现：

```ts
class ConsoleLogger {
  log(message: string) {
    console.log(message);
  }
}

class FileLogger {
  log(message: string) {
    // 写入文件
  }
}

@Module({
  providers: [
    {
      provide: ConsoleLogger,
      useClass: FileLogger,
    },
  ],
})
export class AppModule {}
```

含义是：

```text
别人要 ConsoleLogger，但实际给 FileLogger 的实例。
```

这个机制常用于：

- 本地环境和生产环境使用不同实现。
- 测试时替换真实依赖。
- 某个接口稳定，但实现可以替换。

注意：

```text
useClass 会创建目标 class 的实例。
```

## 方式二：useValue

`useValue` 表示：**直接把一个现成的值放进容器。**

例如注入配置对象：

```ts
const appConfig = {
  appName: 'learn-nest',
  version: '0.1.0',
};

@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useValue: appConfig,
    },
  ],
})
export class AppModule {}
```

使用：

```ts
constructor(
  @Inject('APP_CONFIG')
  private readonly appConfig: { appName: string; version: string },
) {}
```

`useValue` 适合：

- 常量。
- 配置对象。
- 已经创建好的对象。
- 测试 mock。

例如测试时：

```ts
{
  provide: CatsService,
  useValue: {
    findAll: () => ['test cat'],
  },
}
```

注意：

```text
useValue 不会让 Nest new 一个对象，它直接使用你给的值。
```

## 方式三：useFactory

`useFactory` 表示：**用一个函数动态创建 provider 的值。**

例子：

```ts
@Module({
  providers: [
    {
      provide: 'DATABASE_OPTIONS',
      useFactory: () => {
        return {
          host: process.env.DB_HOST ?? 'localhost',
          port: Number(process.env.DB_PORT ?? 3306),
        };
      },
    },
  ],
})
export class AppModule {}
```

如果 factory 需要依赖别的 provider，可以配合 `inject`：

```ts
@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useValue: {
        prefix: 'cat',
      },
    },
    {
      provide: 'CAT_NAME',
      useFactory: (config: { prefix: string }) => {
        return `${config.prefix}-001`;
      },
      inject: ['APP_CONFIG'],
    },
  ],
})
export class AppModule {}
```

含义是：

```text
先从容器里取出 APP_CONFIG，再把它传给 useFactory，最后把 factory 返回值绑定到 CAT_NAME。
```

`useFactory` 适合：

- 根据环境变量生成配置。
- 创建需要异步初始化的对象。
- 根据其他 provider 组合出一个新对象。
- 第三方 SDK 初始化。

注意：

```text
useFactory 的返回值才是最终注入的对象。
```

### 真实业务例子：根据 options 创建数据库连接对象

前面的 `DATABASE_OPTIONS` 例子只演示了“生成配置对象”。

但 `useFactory` 更典型的业务价值是：

```text
先注入 options，再根据 options 创建一个真正可用的对象。
```

例如可以把数据库配置和数据库连接分成两个 provider。

先注册数据库配置：

```ts
type DatabaseOptions = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

@Module({
  providers: [
    {
      provide: 'DATABASE_OPTIONS',
      useValue: {
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'root',
        database: 'learn_nest',
      } satisfies DatabaseOptions,
    },
  ],
})
export class AppModule {}
```

再根据 options 创建连接对象：

```ts
class DatabaseConnection {
  constructor(private readonly options: DatabaseOptions) {}

  connect() {
    return `connect to ${this.options.host}:${this.options.port}/${this.options.database}`;
  }
}

@Module({
  providers: [
    {
      provide: 'DATABASE_OPTIONS',
      useValue: {
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'root',
        database: 'learn_nest',
      } satisfies DatabaseOptions,
    },
    {
      provide: 'DATABASE_CONNECTION',
      useFactory(options: DatabaseOptions) {
        return new DatabaseConnection(options);
      },
      inject: ['DATABASE_OPTIONS'],
    },
  ],
})
export class AppModule {}
```

这里的映射关系是：

```text
inject: ['DATABASE_OPTIONS']
        ↓
从容器中取出 DATABASE_OPTIONS 对应的配置对象
        ↓
作为第一个参数传给 useFactory(options)
        ↓
factory 返回 new DatabaseConnection(options)
        ↓
DATABASE_CONNECTION 这个 token 最终对应数据库连接对象
```

所以这个 provider：

```ts
{
  provide: 'DATABASE_CONNECTION',
  useFactory(options: DatabaseOptions) {
    return new DatabaseConnection(options);
  },
  inject: ['DATABASE_OPTIONS'],
}
```

可以读成：

```text
当别人要 DATABASE_CONNECTION 时，
先取 DATABASE_OPTIONS，
再把 options 传给 factory，
最后把 factory 创建出来的连接对象注入出去。
```

如果真实数据库连接需要异步创建，也可以让 factory 返回 Promise：

```ts
{
  provide: 'DATABASE_CONNECTION',
  async useFactory(options: DatabaseOptions) {
    const connection = new DatabaseConnection(options);
    await Promise.resolve(connection.connect());
    return connection;
  },
  inject: ['DATABASE_OPTIONS'],
}
```

这类场景就是 `useFactory` 比 `useValue`、`useClass` 更合适的原因：

```text
useValue 只能给现成值。
useClass 只能让 Nest new 某个类。
useFactory 可以先拿依赖，再执行自定义创建逻辑。
```

## 方式四：useExisting

`useExisting` 表示：**给已有 provider 起一个别名。**

例子：

```ts
@Injectable()
class NewLogger {
  log(message: string) {
    console.log(message);
  }
}

@Module({
  providers: [
    NewLogger,
    {
      provide: 'OLD_LOGGER',
      useExisting: NewLogger,
    },
  ],
})
export class AppModule {}
```

使用：

```ts
constructor(
  private readonly newLogger: NewLogger,
  @Inject('OLD_LOGGER') private readonly oldLogger: NewLogger,
) {}
```

这里的 `newLogger` 和 `oldLogger` 指向同一个实例。

`useExisting` 适合：

- 给已有 provider 增加兼容旧名称。
- 一个对象希望被多个 token 注入。
- 渐进式重构，不想一次性改完所有调用方。

注意：

```text
useExisting 是别名，不是重新创建。
useClass 是创建另一个 class 的实例。
```

## 四种写法对比

| 写法 | 生成方式 | 典型用途 |
| --- | --- | --- |
| `useClass` | 让 Nest new 一个类 | 替换实现、按环境选择类 |
| `useValue` | 直接使用现成值 | 配置、常量、mock |
| `useFactory` | 执行函数，用返回值 | 动态配置、依赖组合、异步初始化 |
| `useExisting` | 指向已有 provider | 别名、兼容旧 token |

判断方式：

```text
要注入一个类实例？先看 useClass。
要注入一个普通值？用 useValue。
要根据逻辑算出来？用 useFactory。
要复用已有 provider？用 useExisting。
```

## class token、string token、symbol token

### class token

```ts
provide: CatsService
```

优点：

- 最自然。
- 构造器里一般不用写 `@Inject()`。
- 类型和 token 是同一个东西，初学最好理解。

缺点：

- 当你想表达“接口”或“抽象能力”时，class 名可能不够语义化。

### string token

```ts
provide: 'APP_CONFIG'
```

优点：

- 简单直观。
- 适合配置、常量、第三方对象。

缺点：

- 容易拼写错。
- 字符串冲突不容易提前发现。

建议抽成常量：

```ts
export const APP_CONFIG = 'APP_CONFIG';
```

### symbol token

```ts
export const APP_CONFIG = Symbol('APP_CONFIG');
```

优点：

- 不容易冲突。
- 适合库、复杂模块、多人协作项目。

缺点：

- 初学阶段阅读成本略高。

## 为什么接口不能直接当 provider token

TypeScript 的 `interface` 只存在于编译期，运行时会被擦除。

例如：

```ts
interface Logger {
  log(message: string): void;
}
```

编译成 JavaScript 后，`Logger` 这个接口不存在。

但 Nest 的依赖注入发生在运行时，容器必须拿到一个真实存在的 token。

所以不能这样稳定注入：

```ts
constructor(private readonly logger: Logger) {}
```

更可靠的方式是：

```ts
export const LOGGER = Symbol('LOGGER');

@Module({
  providers: [
    {
      provide: LOGGER,
      useClass: ConsoleLogger,
    },
  ],
})
export class AppModule {}
```

使用：

```ts
constructor(@Inject(LOGGER) private readonly logger: Logger) {}
```

这里：

- `Logger` 是 TypeScript 类型，用来约束代码。
- `LOGGER` 是运行时 token，用来给 Nest 容器查找 provider。

## 和第 6 节 IoC 的关系

第 6 节说的是：

```text
对象创建权交给 Nest 容器。
```

第 8 节补上的是：

```text
交给容器以后，可以精确配置容器怎么创建、返回、复用这些对象。
```

如果只会：

```ts
providers: [CatsService]
```

那只能处理最普通的 class 注入。

学会 custom provider 后，就可以处理：

- 配置对象注入。
- 多实现切换。
- 测试 mock。
- 第三方 SDK 注入。
- 老 token 兼容。
- 复杂模块初始化。

## 本节建议练习

建议新建一个独立 L8 项目，避免把 Provider 实验和 L7 调试课混在一起：

```bash
nest new custom-provider
```

如果在当前仓库中继续保持多项目结构，可以放到：

```text
L8/custom-provider/
```

练习顺序：

1. 用 `providers: [CatsService]` 跑通默认 class provider。
2. 改成完整写法 `{ provide: CatsService, useClass: CatsService }`。
3. 添加 `APP_CONFIG`，用 `useValue` 注入配置。
4. 添加 `CAT_NAME`，用 `useFactory` 从配置里生成值。
5. 添加 `LOGGER` token，用 `useClass` 切换不同 logger。
6. 添加 `OLD_LOGGER`，用 `useExisting` 指向现有 logger。
7. 在 Controller 里分别打印这些注入对象，确认它们的行为差异。

## 常见误区

### 误区一：Provider 就等于 Service

不准确。

Service 通常是 Provider，但 Provider 不一定是 Service。

Provider 可以是：

- class 实例。
- 普通对象。
- 字符串、数字、布尔值。
- factory 返回值。
- 第三方库实例。
- 已有 provider 的别名。

### 误区二：`@Injectable()` 就等于已经注册

不准确。

`@Injectable()` 只是说明这个类适合被 Nest 管理和注入。

真正进入容器，还要在 module 的 `providers` 中注册，或者被某个模块导出后再导入。

### 误区三：`provide` 一定要写 class

不准确。

`provide` 可以是：

```ts
CatsService
'APP_CONFIG'
Symbol('APP_CONFIG')
```

它的本质是 token。

### 误区四：`useExisting` 和 `useClass` 一样

不一样。

```ts
{
  provide: 'A',
  useClass: Logger,
}
```

是给 `'A'` 创建或绑定一个 `Logger` 实例。

```ts
{
  provide: 'A',
  useExisting: Logger,
}
```

是让 `'A'` 指向已经存在的 `Logger` provider。

记忆方式：

```text
useClass：新建或使用某个类作为实现。
useExisting：给已有 provider 起别名。
```

### 误区五：`import` 了 class 就等于能注入

不准确。

`import` 是 TypeScript / JavaScript 文件层面的事情：

```ts
import { AppService } from './app.service';
```

它只表示：

```text
当前文件能使用 AppService 这个名字。
```

但 Nest 的依赖注入看的是 provider token 是否注册到了容器中。

如果写：

```ts
{
  provide: 'app_service',
  useClass: AppService,
}
```

容器里注册的是：

```text
'app_service' -> AppService 实例
```

不是：

```text
AppService -> AppService 实例
```

所以这里会报错：

```ts
{
  provide: 'person3',
  useFactory(person: { name: string }, appService: AppService) {
    return {
      name: person.name,
      desc: appService.getHello(),
    };
  },
  inject: ['person', AppService],
}
```

原因是 `inject` 要找的是：

```text
'person'
AppService
```

但容器里只有：

```text
'person'
'app_service'
```

修法一：注入字符串 token。

```ts
inject: ['person', 'app_service']
```

修法二：注册 class token。

```ts
providers: [
  AppService,
  {
    provide: 'person3',
    useFactory(person: { name: string }, appService: AppService) {
      return {
        name: person.name,
        desc: appService.getHello(),
      };
    },
    inject: ['person', AppService],
  },
]
```

记忆方式：

```text
import 解决“这个文件认不认识 AppService”。
providers 解决“Nest 容器里有没有 AppService 这个 token”。
inject 只能写容器里已经注册过的 token。
```

### 误区六：同一个 class 用两个 token 注册一定是同一个实例

不一定。

如果写：

```ts
providers: [
  AppService,
  {
    provide: 'app_service',
    useClass: AppService,
  },
]
```

等价于：

```ts
providers: [
  {
    provide: AppService,
    useClass: AppService,
  },
  {
    provide: 'app_service',
    useClass: AppService,
  },
]
```

容器里是两个不同 token：

```text
AppService    -> AppService 实例 A
'app_service' -> AppService 实例 B
```

这种写法不是语法错误，但多数初学练习里没有必要。

如果只是想让 `'app_service'` 成为 `AppService` 的别名，并且复用同一个实例，应该写：

```ts
providers: [
  AppService,
  {
    provide: 'app_service',
    useExisting: AppService,
  },
]
```

这时容器关系是：

```text
AppService    -> AppService 实例 A
'app_service' -> 指向同一个 AppService 实例 A
```

选择规则：

```text
想用不同 token 创建不同 provider：useClass。
想给已有 provider 起别名并复用实例：useExisting。
```

## 本节检查清单

- [ ] 能说出 `providers: [CatsService]` 的完整写法。
- [ ] 能解释 `provide` 是 token。
- [ ] 能用 `@Inject('TOKEN')` 注入字符串 token。
- [ ] 能用 `useValue` 注入配置对象。
- [ ] 能用 `useFactory` 根据已有 provider 生成新 provider。
- [ ] 能区分 `useClass` 和 `useExisting`。
- [ ] 能解释 `import AppService` 和 `providers: [AppService]` 的区别。
- [ ] 能解释同一个 class 绑定到两个 token 时是否会产生两个实例。
- [ ] 能解释为什么 interface 不能直接作为运行时 token。

## 本节习题参考答案

### 1. `providers: [CatsService]` 的完整写法是什么？

`providers: [CatsService]` 是简写。

完整写法是：

```ts
providers: [
  {
    provide: CatsService,
    useClass: CatsService,
  },
]
```

这里不是字符串 token，而是 class token。

也就是说：

```text
provide: CatsService
```

表示容器里的 key/token 是 `CatsService` 这个 class 本身。

```text
useClass: CatsService
```

表示当有人需要 `CatsService` 这个 token 时，用 `CatsService` 这个类创建实例。

所以：

```ts
constructor(private readonly catsService: CatsService) {}
```

通常能自动注入，因为构造器参数类型也是 `CatsService`，Nest 可以根据类型元数据找到同名 class token。

注意它和下面这种写法不一样：

```ts
{
  provide: 'CatsService',
  useClass: CatsService,
}
```

这里的 token 是字符串 `'CatsService'`，Controller 里通常要写：

```ts
constructor(
  @Inject('CatsService')
  private readonly catsService: CatsService,
) {}
```

### 2. `provide` 是什么？

`provide` 是 Nest 容器里的 token，可以先理解成 key。

Provider 注册时，本质上是在告诉 Nest：

```text
某个 token 对应某个值、类、factory 结果或已有 provider。
```

例如：

```ts
{
  provide: 'person',
  useValue: {
    name: 'wang',
    age: 20,
  },
}
```

可以理解成容器里有：

```text
'person' -> { name: 'wang', age: 20 }
```

token 可以是：

- class，例如 `AppService`
- string，例如 `'person'`
- symbol，例如 `Symbol('person')`

### 3. 如何用 `@Inject('TOKEN')` 注入字符串 token？

如果 provider 使用字符串 token：

```ts
{
  provide: 'person',
  useValue: {
    name: 'wang',
    age: 20,
  },
}
```

在 Controller 或 Service 中注入时，需要显式写：

```ts
constructor(
  @Inject('person')
  private readonly person: { name: string; age: number },
) {}
```

原因是 TypeScript 的类型 `{ name: string; age: number }` 运行时不存在，Nest 不能靠它自动知道要找 `'person'`。

所以：

```text
@Inject('person')
```

是在告诉 Nest：

```text
这个参数的值来自 'person' 这个 provider token。
```

### 4. 如何用 `useValue` 注入配置对象？

`useValue` 用来直接提供一个现成值。

例如：

```ts
{
  provide: 'APP_CONFIG',
  useValue: {
    appName: 'learn-nest',
    port: 3000,
  },
}
```

使用时：

```ts
constructor(
  @Inject('APP_CONFIG')
  private readonly config: { appName: string; port: number },
) {}
```

`useValue` 不会让 Nest `new` 一个对象。

它就是直接把你写好的值放到容器里：

```text
'APP_CONFIG' -> { appName: 'learn-nest', port: 3000 }
```

适合放：

- 常量
- 配置对象
- mock 对象
- 已经创建好的实例

### 5. 如何用 `useFactory` 根据已有 provider 生成新 provider？

`useFactory` 用函数返回最终要注入的值。

如果 factory 需要依赖其他 provider，需要配合 `inject`。

例如：

```ts
{
  provide: 'person',
  useValue: {
    name: 'wang',
    age: 20,
  },
},
{
  provide: 'person_desc',
  useFactory(person: { name: string; age: number }) {
    return `${person.name}-${person.age}`;
  },
  inject: ['person'],
}
```

执行逻辑是：

```text
1. Nest 看到 person_desc 要用 useFactory 创建。
2. Nest 根据 inject: ['person'] 去容器里取 'person'。
3. 把取出的对象传给 useFactory 的第一个参数。
4. useFactory 返回的字符串成为 person_desc 的值。
```

所以：

```text
inject 数组里的 token 是参数来源。
useFactory 的形参是接收位置。
```

数据库连接对象也是类似思路：

```ts
{
  provide: 'DATABASE_CONNECTION',
  useFactory(options: DatabaseOptions) {
    return new DatabaseConnection(options);
  },
  inject: ['DATABASE_OPTIONS'],
}
```

### 6. `useClass` 和 `useExisting` 有什么区别？

`useClass` 是用某个类创建 provider 实例。

```ts
{
  provide: 'app_service',
  useClass: AppService,
}
```

含义：

```text
当有人要 'app_service' 时，用 AppService 这个类创建实例。
```

`useExisting` 是给已有 provider 起别名。

```ts
providers: [
  AppService,
  {
    provide: 'app_service',
    useExisting: AppService,
  },
]
```

含义：

```text
'app_service' 指向已经存在的 AppService provider。
```

区别：

```text
useClass 可能创建一个新的实例。
useExisting 复用已有实例。
```

### 7. `import AppService` 和 `providers: [AppService]` 有什么区别？

`import` 是文件层面的导入：

```ts
import { AppService } from './app.service';
```

它的作用是：

```text
让当前文件认识 AppService 这个名字。
```

但它不会把 `AppService` 注册进 Nest 容器。

`providers: [AppService]` 是 Nest 容器层面的注册：

```ts
@Module({
  providers: [AppService],
})
export class AppModule {}
```

它的完整写法是：

```ts
{
  provide: AppService,
  useClass: AppService,
}
```

也就是说：

```text
import 解决 TypeScript 文件能不能使用这个 class 名字。
providers 解决 Nest 容器里有没有这个 provider token。
```

两者不是互相替代关系。

### 8. 同一个 class 绑定到两个 token，会不会产生两个实例？

可能会。

例如：

```ts
providers: [
  AppService,
  {
    provide: 'app_service',
    useClass: AppService,
  },
]
```

等价于：

```ts
providers: [
  {
    provide: AppService,
    useClass: AppService,
  },
  {
    provide: 'app_service',
    useClass: AppService,
  },
]
```

容器里是两个 token：

```text
AppService    -> AppService 实例 A
'app_service' -> AppService 实例 B
```

如果只是想让 `'app_service'` 成为 `AppService` 的别名，不想创建第二个实例，要用：

```ts
providers: [
  AppService,
  {
    provide: 'app_service',
    useExisting: AppService,
  },
]
```

这时是：

```text
AppService    -> AppService 实例 A
'app_service' -> 同一个 AppService 实例 A
```

### 9. 为什么 interface 不能直接作为运行时 token？

因为 TypeScript 的 `interface` 只存在于编译期，编译成 JavaScript 后会消失。

例如：

```ts
interface Logger {
  log(message: string): void;
}
```

运行时没有 `Logger` 这个值。

但 Nest 的依赖注入发生在运行时，必须拿到真实存在的 token。

所以不能依赖 interface 本身做 provider token。

应该用 class、string 或 symbol 作为 token：

```ts
export const LOGGER = Symbol('LOGGER');

{
  provide: LOGGER,
  useClass: ConsoleLogger,
}
```

然后注入：

```ts
constructor(
  @Inject(LOGGER)
  private readonly logger: Logger,
) {}
```

这里：

```text
LOGGER 是运行时 token。
Logger interface 是 TypeScript 类型约束。
```

## 参考资料

- Nest 官方文档：Providers：https://docs.nestjs.com/providers
- Nest 官方文档：Custom providers：https://docs.nestjs.com/fundamentals/custom-providers
- Nest 官方文档：Modules：https://docs.nestjs.com/modules

## 下一步

1. 已创建 `L8/custom-provider` 并完成本节练习。
2. 按 `useClass -> useValue -> useFactory -> useExisting` 顺序完成练习。
3. 练习完成后，进入第 9 节“全局模块和生命周期”。

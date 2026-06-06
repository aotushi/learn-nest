# 04 快速掌握 Nest CLI

## 本节目标

Nest CLI 是 Nest 项目的工程化入口。

学完这一节，需要能回答四个问题：

1. 如何创建一个 Nest 项目？
2. 如何用 CLI 快速生成 module、controller、service、resource？
3. `nest build` 和 `nest start` 分别解决什么问题？
4. `nest-cli.json` 能把哪些命令选项固化到项目配置里？

## CLI 的两种使用方式

Nest CLI 的 npm 包名是 `@nestjs/cli`，真正使用时执行的是它提供的 `nest` 命令。

获取 `nest` 命令有两种方式：

| 方式 | 命令入口 | 特点 | 适合场景 |
| --- | --- | --- | --- |
| 临时执行 | `npx @nestjs/cli ...` | 不需要全局安装，用完即走 | 偶尔创建项目、想用较新的 CLI |
| 全局安装 | `nest ...` | 先全局安装，再长期使用 | 经常创建 Nest 项目、希望命令更短 |

### 方式一：临时执行

临时执行的特点是：不用提前全局安装，命令执行时由包管理器下载并运行 CLI 包。

课程中的写法：

```bash
npx @nestjs/cli new my-app
```

适合场景：

- 偶尔创建项目。
- 不想污染全局环境。
- 想尽量使用最新 CLI 创建项目。

### 方式二：全局安装后执行

全局安装的特点是：先把 CLI 装到全局，以后可以在任意目录直接使用 `nest` 命令。

```bash
npm install -g @nestjs/cli
nest new my-app
```

适合场景：

- 经常创建 Nest 项目。
- 希望命令更短。
- 希望在任意目录直接执行 `nest`。

全局安装后要定期升级，否则新建项目时可能使用旧模板：

```bash
npm update -g @nestjs/cli
```

### 本项目为什么用了 `pnpm dlx`

课程里讲的是 `npx`，本项目实际用了：

```bash
pnpm dlx @nestjs/cli new . --package-manager pnpm --skip-git
```

`pnpm dlx` 可以理解为 pnpm 版本的 `npx`：

- `npx @nestjs/cli ...`：用 npm 临时下载并执行一个包里的命令。
- `pnpm dlx @nestjs/cli ...`：用 pnpm 临时下载并执行一个包里的命令。

这不是课程里的新知识点，而是本项目因为使用 pnpm，所以把 `npx` 换成了 pnpm 生态下更一致的写法。

## 命令结构

总结构：

```bash
nest <command> [options]
```

常见全局选项：

```bash
nest -h
nest -v
```

常见子命令：

```bash
nest new my-app
nest generate module users
nest build
nest start
nest info
```

部分命令有别名：

```bash
nest n my-app
nest g service users
nest i
```

读帮助信息时要注意：

- `new|n` 表示 `new` 和 `n` 是同一个命令。
- `[options]` 表示可选参数。
- `[name]` 表示名字参数可选。
- `<schematic>` 表示生成类型必填。
- 表格里的 `name` 是 schematic 名称列表，不是命令格式里的 `[name]`。

## `nest new`

`nest new` 用于创建完整 Nest 项目。

```bash
nest new my-app
```

常见选项：

```bash
nest new my-app --skip-git
nest new my-app --skip-install
nest new my-app --package-manager pnpm
nest new my-app --language ts
nest new my-app --strict
```

选项含义：

- `--skip-git`：不自动初始化 git。
- `--skip-install`：只生成文件，不自动安装依赖。
- `--package-manager`：指定 npm、yarn、pnpm 等包管理器。
- `--language`：指定 TypeScript 或 JavaScript。
- `--strict`：创建项目时启用更严格的 TypeScript 配置。

本项目实际创建命令：

```bash
pnpm dlx @nestjs/cli new . --package-manager pnpm --skip-git


# 等价的 npx 写法
npx @nestjs/cli new . --package-manager pnpm --skip-git
```

这里的 `.` 表示在当前目录创建项目，而不是新建一个子目录。

生成的关键文件：

- `src/main.ts`：应用入口。
- `src/app.module.ts`：根模块。
- `src/app.controller.ts`：示例控制器。
- `src/app.service.ts`：示例服务。
- `test/`：端到端测试示例。
- `nest-cli.json`：Nest CLI 配置。
- `package.json`：脚本和依赖。

## `nest generate`

`nest generate` 用于生成 Nest 代码骨架，别名是 `nest g`。

命令格式：

```bash
nest generate <schematic> [name] [path]
nest g <schematic> [name] [path]
```

其中：

- `<schematic>`：要生成的代码类型，例如 module、controller、service。
- `[name]`：生成对象的名字。
- `[path]`：生成位置，通常可以省略。

常见生成命令：

```bash
nest g module users
nest g controller users
nest g service users
nest g resource cats
```

常见别名：

```bash
nest g mo users
nest g co users
nest g s users
nest g res cats
```

核心理解：

- 生成 module 时，CLI 会创建 module 文件，并把它接入上级 module。
- 生成 controller/service 时，CLI 会创建文件，并把它注册到对应 module。
- 生成 resource 时，CLI 会一次性创建一组 REST CRUD 相关文件。
- 这些模板来自 `@nestjs/schematics`。

常见选项：

```bash
nest g service users --flat
nest g service users --no-flat
nest g service users --spec
nest g service users --no-spec
nest g service users --skip-import
nest g service users --project admin
```

选项含义：

- `--flat`：不额外生成同名目录。
- `--no-flat`：生成同名目录。
- `--spec`：生成测试文件。
- `--no-spec`：不生成测试文件。
- `--skip-import`：只生成文件，不自动注册到 module。
- `--project`：指定 monorepo 中的目标子项目。

本项目实际生成了 `cats` 资源：

```bash
pnpm nest generate resource cats --no-spec
pnpm install
```

生成结果：

- `src/cats/cats.module.ts`
- `src/cats/cats.controller.ts`
- `src/cats/cats.service.ts`
- `src/cats/dto/create-cat.dto.ts`
- `src/cats/dto/update-cat.dto.ts`
- `src/cats/entities/cat.entity.ts`

同时，`CatsModule` 被自动加入 `AppModule`。

## `nest build`

`nest build` 用于构建项目，默认输出到 `dist/`。

```bash
nest build
```

常见选项：

```bash
nest build --watch
nest build --webpack
nest build --tsc
```

理解点：

- `tsc` 是 TypeScript 编译，不做整体打包。
- `webpack` 会把代码打包成更集中的产物。
- Node 项目不一定需要打包，但打包后可能改善加载表现。
- `--watch` 会监听文件变化并自动重新构建。
- `--watchAssets` 可配合 assets 配置监听非 TS/JS 文件。
- `--path` 指定 TypeScript 配置文件。
- `--config` 指定 Nest CLI 配置文件。

本项目验证命令：

```bash
pnpm build
```

## `nest-cli.json`

`nest-cli.json` 是 Nest CLI 的项目级配置文件。

它的价值是：把常用命令选项固定到项目配置里，减少每次手写参数。

### 当前项目配置

当前项目的初始配置很简单：

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

含义：

- `$schema`：声明配置文件的 JSON Schema，编辑器可以据此提供补全和校验。
- `collection`：指定代码生成模板集合，默认使用 `@nestjs/schematics`。
- `sourceRoot`：指定源码目录，默认是 `src`。
- `compilerOptions.deleteOutDir`：构建前清空输出目录，避免旧产物残留。

### `compilerOptions`

`compilerOptions` 影响 `nest build` 和 `nest start` 中的构建行为。

常见配置：

```json
{
  "compilerOptions": {
    "webpack": false,
    "deleteOutDir": true
  }
}
```

对应关系：

- `"webpack": true`：接近执行 `nest build --webpack`。
- `"webpack": false`：使用 TypeScript 编译器，也就是 `tsc` 路线。
- `"deleteOutDir": true`：每次构建前删除输出目录，通常是 `dist/`。

`tsc` 和 `webpack` 的区别：

- `tsc`：只把 TypeScript 编译成 JavaScript，不做整体打包。
- `webpack`：会把模块打包，产物更集中，但构建链路更重。

Node 服务端项目通常不强制打包；是否用 webpack，要看部署体积、启动速度、构建复杂度等实际需求。

### `assets`

`assets` 用来声明构建时要复制的非 TS/JS 资源。

例如项目里有 markdown、yaml、模板文件、静态配置文件，需要进入 `dist/`，就可以配置：

```json
{
  "compilerOptions": {
    "assets": [
      {
        "include": "**/*.yml",
        "exclude": "**/local.*.yml",
        "watchAssets": true
      }
    ]
  }
}
```

理解点：

- `include`：要复制哪些资源。
- `exclude`：排除哪些资源。
- `watchAssets`：watch 模式下是否监听这些资源变化。

注意：Nest CLI 的 assets 复制主要面向 `sourceRoot` 下的文件。非 `src` 目录下的资源，如果 CLI 不处理，后续可以用单独脚本复制。

### `generateOptions`

`generateOptions` 影响 `nest generate` 的默认行为。

例如：

```json
{
  "generateOptions": {
    "flat": false,
    "spec": false
  }
}
```

对应关系：

- `"flat": false`：类似默认加 `--no-flat`，生成同名目录。
- `"flat": true`：类似加 `--flat`，文件直接放在当前目标目录。
- `"spec": false`：类似加 `--no-spec`，默认不生成测试文件。
- `"spec": true`：类似加 `--spec`，默认生成测试文件。

示例：

```bash
nest g service users
```

如果 `generateOptions.spec` 是 `false`，就不会生成 `users.service.spec.ts`。

如果 `generateOptions.flat` 是 `false`，更倾向生成：

```text
src/users/users.service.ts
```

而不是直接生成在当前目录下。

### `sourceRoot` 和 `entryFile`

- `sourceRoot`：源码根目录，默认是 `src`。
- `entryFile`：入口文件名，默认是 `main`，对应 `src/main.ts`。

如果未来项目入口从 `src/main.ts` 变成别的文件名，才需要调整 `entryFile`。

### `$schema`

`$schema` 指向 `nest-cli.json` 的配置规范。

它的作用不是运行时逻辑，而是让编辑器知道这个 JSON 文件支持哪些字段、字段类型是什么。

可以通过这个地址查看完整配置定义：

```text
https://json.schemastore.org/nest-cli
```

### 当前是否要修改配置

当前项目暂时不修改 `nest-cli.json`。

原因：

- 现在处于 CLI 学习阶段，先观察默认行为。
- 当前项目已经默认开启 `deleteOutDir`，够用。
- `spec` 是否关闭要等后续测试策略确定，不急着全局禁用。
- `assets` 要等项目真的有 yml、md、模板、静态资源后再配置。
- `webpack` 暂时没有必要开启，先使用默认构建链路。

## `nest start`

`nest start` 用于启动应用。

```bash
nest start
```

开发中最常用的是 watch 模式：

```bash
nest start --watch
```

常见选项：

```bash
nest start --watch
nest start --debug
nest start --exec node
```

理解点：

- `--watch` 会监听文件变化，变更后自动重新编译并重启。
- `--debug` 用于开启调试能力。
- `--exec` 可以指定用什么运行编译后的代码，默认是 Node.js。
- `nest start` 的不少构建相关选项和 `nest build` 一致。

本项目常用脚本：

```bash
pnpm start:dev
```

对应 `package.json` 中的：

```json
{
  "scripts": {
    "start:dev": "nest start --watch"
  }
}
```

## `nest info`

`nest info` 用于查看当前环境和 Nest 依赖版本。

```bash
nest info
pnpm nest info
```

适合排查：

- Node 版本是否异常。
- 包管理器版本是否异常。
- Nest CLI 和项目依赖版本是否一致。
- `@nestjs/common`、`@nestjs/core`、`@nestjs/platform-express` 等包版本是否匹配。

本项目当前信息：

```text
OS: Windows 10.0.26200
Node.js: v22.19.0
pnpm: 10.26.2
Nest CLI: 11.0.21
Nest core/common/platform-express: 11.1.24
@nestjs/schematics: 11.1.0
@nestjs/mapped-types: 2.1.1
```

## 本项目实践记录

本节已完成：

- 初始化 Nest 项目。
- 使用 pnpm 管理依赖。
- 使用 CLI 生成 `cats` REST 资源骨架。
- 修复 CLI 模板在当前 ESLint 规则下的未使用参数问题。
- 验证根路由和 `cats` 路由可访问。

已验证：

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

接口检查：

```bash
GET /
GET /cats
GET /cats/1
```

## 这一节真正要记住的东西

Nest CLI 不只是创建项目的工具，它负责把一套工程约定落到命令里：

- `new` 负责项目初始化。
- `generate` 负责按 Nest 约定生成代码。
- `build` 负责构建产物。
- `start` 负责开发期启动和监听。
- `info` 负责查看环境和依赖版本。
- `nest-cli.json` 负责把命令选项项目化。

后续写 Nest 时，不要手动复制粘贴 module/controller/service 文件，优先用 CLI 生成，再根据业务修改。

## 下一步

1. 阅读 `src/cats` 下生成文件，理解默认 CRUD 路由。
2. 进入第 5 节 HTTP 数据传输方式，开始补 Controller 参数获取能力。

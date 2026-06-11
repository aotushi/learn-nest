# 学习日志

## 2026-06-06

### 04 快速掌握 Nest CLI

- 使用 Nest CLI 初始化项目。
- 使用 pnpm 安装依赖。
- 使用 `nest generate resource cats --no-spec` 生成 REST CRUD 骨架。
- 观察 CLI 自动创建 module/controller/service/dto/entity，并把 `CatsModule` 接入 `AppModule`。
- 已完成 `pnpm test`、`pnpm test:e2e`、`pnpm build` 验证。

### 待办

- 跑通 `pnpm start:dev` 并手动访问接口。
- 阅读 `src/cats` 下生成文件，理解默认 CRUD 路由。
- 提交初始化项目和学习笔记。

### 05 5 种 HTTP 数据传输方式

- 已整理课前笔记，明确 5 种传参方式：URL Param、Query、Form Urlencoded、JSON、Form Data。
- 下一步基于 `src/cats` 练习 `@Param()`、`@Query()`、`@Body()` 和文件上传。

### 06 IoC 解决了什么痛点问题？

- 已整理 IoC 和 DI 的关系：IoC 是控制权反转的思想，DI 是依赖注入的实现方式。
- 已结合当前项目梳理 `AppModule -> CatsModule -> CatsController -> CatsService` 的依赖链路。
- 已明确 `controllers`、`providers`、`imports`、`exports` 的职责边界。
- 下一步进入第 7 节，学习 Nest 项目调试方式。

## 2026-06-09

### 07 如何调试 Nest 项目

- 已整理 Node inspector、`--inspect`、`--inspect-brk` 和 Nest `start:debug` 的关系。
- 已区分 VS Code `attach` 和 `launch` 两种调试方式。
- 已记录当前项目推荐的 pnpm 版 `launch.json` 配置。
- 下一步可以实际配置 VS Code Debug，并对 `CatsController` 的接口打断点验证。

## 2026-06-11

### 08 使用多种 Provider，灵活注入对象

- 已创建 L8 笔记，明确本节从普通 class provider 进入 custom provider。
- 本节重点区分 `useClass`、`useValue`、`useFactory`、`useExisting`。
- 已创建 `L8/custom-provider`，按四种 provider 写法分别练习注入行为。

### 09 全局模块和生命周期

- 已创建 L9 笔记，延续 L8 的 module/provider 视角。
- 本节重点区分普通模块导入、全局模块、应用生命周期和请求生命周期。
- 已创建 `L9/global-and-lifecycle`，观察模块初始化和应用关闭阶段的日志顺序。

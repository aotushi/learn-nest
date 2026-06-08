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

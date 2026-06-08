# Nest 通关秘籍学习路线

教程地址：https://juejin.cn/book/7226988578700525605/section/7227000404859420732

## 记录原则

- 只记录自己的理解、实践步骤、踩坑和改造点。
- 不复制付费课程正文、大段截图或可替代课程购买的内容。
- 如需临时保存本地资料，放入 `.raw-data/`，该目录不提交。
- `src/` 始终保留当前最新可运行项目；历史课程代码依靠 git commit/tag 追踪。
- 需要保留的小型独立实验放入 `examples/lessons/`，不要在 `src/` 里按课程序号堆历史代码。

## 当前进度

- 当前课程：05 5 种 HTTP 数据传输方式
- 当前项目：使用 Nest CLI 初始化的 `learn-nest`
- 包管理器：pnpm
- Node 版本：22.19.0

## 两周主线

1. Nest 基础：CLI、模块、Controller、Provider、依赖注入、调试。
2. HTTP 接口：参数传递、DTO、Pipe、Exception Filter、Interceptor。
3. 数据层：MySQL、TypeORM、Redis、配置管理。
4. 鉴权：JWT、Session、RBAC、无感刷新。
5. 实战项目：会议室预订系统核心链路。
6. 工程化：Swagger、日志、Docker、部署。

## 取舍

- 第一轮重点：Nest 基础 + 会议室预订系统。
- 第二轮再补：微服务、考试系统、聊天室、GraphQL、源码调试。

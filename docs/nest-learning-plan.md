# Nest 课程学习计划

## 目标

当前目标不是慢速精读整本课程，而是先完成一轮可运行、可复盘的 Nest 主线学习。

第一轮重点：

- 掌握 Nest 基础结构：CLI、Module、Controller、Provider、DI、调试。
- 跑通 HTTP 接口开发：参数接收、DTO、Pipe、异常处理、拦截器。
- 进入数据层和鉴权：TypeORM、配置、Redis、JWT、Session、RBAC。
- 完成会议室预订系统核心链路。

第一轮暂缓：

- 微服务。
- GraphQL。
- 源码深挖。
- 聊天室、考试系统等扩展项目。

这些内容适合第二轮补。

## 时间判断

在待业、每天能投入 6 到 8 小时的前提下：

- 1 周速通风险偏高，容易变成只看课不吸收。
- 2 周完成第一轮主线更合理。
- 如果每天实际只有 3 到 4 小时，需要按 3 到 4 周估算。

这里的“完成”不是指记住所有细节，而是指：

- 每节课有自己的笔记。
- 核心代码能跑。
- 关键报错有记录。
- 每个阶段有 commit/tag 可以回看。

## 每日节奏

建议每天按 3 个学习块安排：

```text
上午：新课输入 + 跟写核心代码
下午：独立复现 + 调试报错 + 整理笔记
晚上：轻量复盘 + Agent 课程或补基础
```

不要把 Nest 和 Agent 两门课完全并行到上午/下午平均切分。

更合适的关系是：

```text
Nest 是主线项目课。
Agent 是辅助输入课。
```

原因：

- Nest 需要连续上下文，上午/下午切断会降低代码项目的连续性。
- Agent 课程目前还在进程中，更适合放到晚上做低强度跟进。
- 当前主要目标是尽快形成后端项目能力，Nest 应优先保证大块时间。

## 每天看几节

按课程难度分层：

| 阶段 | 建议速度 |
| --- | --- |
| CLI、调试、基础概念 | 每天 2 到 4 节 |
| Provider、Module、Pipe、Interceptor、Exception | 每天 1 到 2 节 |
| 数据库、鉴权、RBAC、Redis | 每天 1 节，必要时 0.5 节 |
| 实战项目 | 按功能切分，不按课时硬赶 |

判断是否可以进入下一节，不看“视频是否看完”，看下面 4 件事：

1. 笔记已经记录自己的理解。
2. 代码至少跑通过一次。
3. 本节新增概念能用自己的话解释。
4. 当前状态已 commit，重要节点已 tag。

## 两周主线安排

### 第 1 到 2 天：Nest 基础骨架

目标：

- CLI。
- Controller。
- Service。
- Module。
- HTTP 参数传递。
- 调试方式。

产出：

- 能独立创建 Nest 项目。
- 能写 GET / POST / URL Param / Query / Body / Form Data。
- 能用 VS Code Debug 停到接口代码。

### 第 3 到 4 天：DI、Provider、Module

目标：

- IoC / DI。
- 普通 provider。
- custom provider。
- `useClass`、`useValue`、`useFactory`、`useExisting`。
- 全局模块、动态模块、生命周期。

产出：

- 能解释 Nest 容器如何管理对象。
- 能用自定义 token 注入配置或 mock。
- 能区分 class token、string token、symbol token。

### 第 5 到 6 天：请求处理链路

目标：

- Pipe。
- ValidationPipe。
- DTO 校验。
- Exception Filter。
- Interceptor。
- Middleware / Guard 初步理解。

产出：

- 能搭出标准接口入参校验。
- 能统一错误返回。
- 能理解请求进入 Nest 后经过哪些环节。

### 第 7 到 9 天：数据层

目标：

- 配置管理。
- TypeORM。
- MySQL。
- Entity / Repository。
- Redis 基础使用。

产出：

- 能把接口从内存数据改成数据库数据。
- 能完成增删改查。
- 能理解配置为什么不应该写死在代码里。

### 第 10 到 11 天：鉴权和权限

目标：

- JWT。
- Session。
- 登录注册。
- 无感刷新。
- RBAC。

产出：

- 能写登录接口。
- 能保护需要登录的接口。
- 能按角色限制访问。

### 第 12 到 14 天：会议室预订系统主线

目标：

- 用户模块。
- 登录鉴权。
- 会议室管理。
- 预订流程。
- 基础后台接口。
- Swagger / 日志 / 部署前准备。

产出：

- 至少跑通核心业务链路。
- 形成一个可继续扩展的 Nest 项目。
- 整理第一轮遗留问题清单。

## 每节课的固定流程

每节课按这个顺序推进：

1. 先看课程，抓主概念。
2. 创建或更新 `docs/lessons/NN-topic.md`。
3. 在对应 lesson 项目目录里写代码。
4. 手动请求验证。
5. 记录踩坑。
6. 跑必要验证。
7. commit。
8. 阶段完成后打 tag。

不要一口气看很多课再回头写代码。

推荐节奏：

```text
看一小段 -> 写一小段 -> 跑一次 -> 记一次
```

## 提交规则

课程代码按独立目录组织：

```text
L4-L6/
L7/
L8/
```

提交粒度：

- 结构调整单独提交。
- 每节课练习单独提交。
- 笔记和对应练习可以在同一个 lesson commit 中。
- 大的目录迁移不要和课程代码混在一个提交。

标签命名：

```text
lesson-04-nest-cli
lesson-05-http-data-transfer
lesson-06-ioc
lesson-07-debug-nest-project
lesson-08-multiple-providers
```

## 当前进度

已完成：

- L4：Nest CLI。
- L5：HTTP 数据传输。
- L6：IoC / DI 痛点。
- L7：Nest 调试。

当前进入：

- L8：使用多种 Provider，灵活注入对象。

下一步：

- 创建或继续完善 `L8/custom-provider`。
- 练习 `useClass`、`useValue`、`useFactory`、`useExisting`。
- 完成后提交并打 `lesson-08-multiple-providers` 标签。

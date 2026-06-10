# 07 如何调试 Nest 项目

## 本节目标

这一节的重点是从 `console.log` 调试，升级到断点调试。

学完这一节，需要能回答：

1. 为什么复杂代码不能只靠 `console.log`？
2. Node.js 的 `--inspect` 和 `--inspect-brk` 分别是什么？
3. Nest 项目为什么本质上还是 Node 调试？
4. VS Code 里 `attach` 和 `launch` 两种调试方式有什么区别？
5. 普通断点、Logpoint、条件断点、异常断点分别适合什么场景？

## 为什么不能只靠 `console.log`

`console.log` 适合快速确认一个变量值，但它有明显限制：

- 只能看到你打印的那个点。
- 看不到完整调用栈。
- 看不到当前作用域里其他变量。
- 很容易为了调试留下临时代码。
- 遇到复杂调用链时，要反复加日志、删日志。

断点调试能看到更多信息：

- 当前执行到哪一行。
- 当前作用域有哪些变量。
- 函数是从哪里被调用过来的。
- 每一步执行后变量如何变化。
- 异常抛出时停在哪个位置。

一句话：

**`console.log` 看单点；断点调试看执行路线。**

## Node 调试的基础

Nest 最终运行在 Node.js 上，所以 Nest 调试的底层仍然是 Node 调试。

Node 可以通过 inspector 协议启动调试服务：

```bash
node --inspect index.js
```

或：

```bash
node --inspect-brk index.js
```

区别：

| 命令 | 含义 | 是否一启动就停住 |
| --- | --- | --- |
| `--inspect` | 启动调试服务 | 否 |
| `--inspect-brk` | 启动调试服务并在首行暂停 | 是 |

默认调试端口通常是：

```text
9229
```

启动后，可以用调试客户端连接它。

常见调试客户端：

- Chrome DevTools：访问 `chrome://inspect/`
- VS Code Debugger：通过 `.vscode/launch.json` 配置

## Chrome DevTools 调试 Node

Node 以调试模式启动后，可以打开：

```text
chrome://inspect/
```

如果页面里没看到目标，可以手动添加：

```text
localhost:9229
```

然后点击 `inspect`，就能打开 DevTools 调试界面。

能观察到：

- 代码停在哪一行。
- 当前作用域变量。
- 调用栈。
- 单步执行结果。

这个方式能帮助理解 Node 调试原理，但平时写 Nest 项目不一定最方便。

## Nest 的 `start:debug`

当前项目的 `package.json` 已经有：

```json
{
  "scripts": {
    "start:debug": "nest start --debug --watch"
  }
}
```

可以这样启动：

```bash
pnpm start:debug
```

它的核心效果是让 Nest 用调试模式启动 Node 进程。

注意：

- `--debug` 接近 Node 的 `--inspect`。
- 它不会像 `--inspect-brk` 一样默认在首行暂停。
- 如果代码没有断点，也没有 `debugger` 语句，看起来可能像“没有发生调试”。

可以在代码中临时加：

```ts
debugger;
```

或直接在 VS Code 左侧行号处打断点，然后访问接口触发代码执行。

## VS Code 调试方式一：Attach

`attach` 的意思是：**先启动一个已经带调试端口的 Node/Nest 进程，再让 VS Code 连接过去。**

流程：

1. 先启动 Nest 调试进程：

```bash
pnpm start:debug
```

2. VS Code 通过 `attach` 配置连接 `9229` 端口。

示意配置：

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach Nest",
  "port": 9229,
  "skipFiles": ["<node_internals>/**"]
}
```

适合场景：

- 服务已经在终端里启动。
- 想临时把 VS Code 调试器接上去。
- 调试远程或特殊启动方式的 Node 进程。

## VS Code 调试方式二：Launch

`launch` 的意思是：**让 VS Code 负责启动程序，并自动进入调试模式。**

课程推荐的更方便方式，就是在 VS Code 里配置一个 npm script 调试项。

当前项目使用 pnpm，所以更贴合本项目的配置是：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Nest",
  "runtimeExecutable": "pnpm",
  "args": ["start:dev"],
  "skipFiles": ["<node_internals>/**"],
  "console": "integratedTerminal"
}
```

这里的含义：

- `type: "node"`：调试 Node.js 程序。
- `request: "launch"`：由 VS Code 启动程序。
- `runtimeExecutable: "pnpm"`：执行 `pnpm` 命令。
- `args: ["start:dev"]`：传给 pnpm 的参数，相当于 `pnpm start:dev`。
- `skipFiles`：跳过 Node 内部代码，不进去调 Node 源码。
- `console: "integratedTerminal"`：使用 VS Code 集成终端输出日志。

如果使用课程里的 npm 写法，对应是：

```json
{
  "runtimeExecutable": "npm",
  "args": ["run", "start:dev"]
}
```

本项目优先用 pnpm 写法，和仓库包管理器保持一致。

## Attach 和 Launch 的区别

| 方式 | 谁启动服务 | 什么时候用 |
| --- | --- | --- |
| `attach` | 你先在终端启动 | 服务已经运行，只想把调试器接上去 |
| `launch` | VS Code 启动 | 平时开发，点击调试按钮直接跑项目 |

初学阶段建议：

```text
日常开发：优先 launch
排查已有进程：再用 attach
```

## 断点类型

### 普通断点

最常用。

在 VS Code 行号左侧点击，代码执行到这一行时暂停。

适合：

- 看变量值。
- 看调用栈。
- 单步执行。
- 判断代码有没有走到这里。

### Logpoint

Logpoint 是“只打印，不暂停”的断点。

适合：

- 想临时打印变量。
- 不想污染代码。
- 不想写完 `console.log` 又删掉。

变量通常用 `{}` 包起来，例如：

```text
id = {id}, body = {JSON.stringify(createCatDto)}
```

### 条件断点

条件断点只有表达式成立时才暂停。

适合：

- 循环很多次，只想停在某个条件。
- 接口请求很多，只想停在某个参数。

示例条件：

```ts
id === '123'
```

或：

```ts
createCatDto.name === 'tom'
```

### 异常断点

异常断点会在异常抛出时暂停。

适合：

- 不知道异常从哪里抛出。
- 调用栈很长。
- 只看到最终错误日志，但不知道源头。

在 VS Code 调试面板里可以开启异常断点。

## 本项目调试建议

当前项目还没有 `.vscode/launch.json`。

如果要开始实际练习，可以新建：

```text
.vscode/launch.json
```

推荐配置：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Nest",
      "runtimeExecutable": "pnpm",
      "args": ["start:dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

练习路径：

1. 在 `src/cats/cats.controller.ts` 的某个接口方法里打断点。
2. 用 VS Code 的 `Debug Nest` 启动项目。
3. 浏览器或前端页面访问对应接口。
4. 观察断点暂停时的 `Variables`、`Call Stack`、`Scope`。
5. 用 Step Over / Step Into / Continue 控制执行。

建议先调试这些接口：

```text
GET  /cats
GET  /cats/find?name=tom&age=2
POST /cats
POST /cats/file
```

## 调试时常见问题

### 断点没有停住

先检查：

- 是否真的通过 VS Code Debug 启动，而不是普通终端启动。
- 请求是否打到了你下断点的接口。
- 端口是否访问的是当前启动的服务。
- 是否有另一个旧的 Nest 进程占用了 `3000`。

端口占用排查看：

```text
docs/troubleshooting.md
```

### Chrome Inspect 找不到目标

检查：

- 是否用了 `pnpm start:debug` 或 `nest start --debug`。
- 是否监听在 `9229`。
- `chrome://inspect/` 是否添加了 `localhost:9229`。

### Debug Console 输出不好看

使用：

```json
"console": "integratedTerminal"
```

这样日志会进入 VS Code 集成终端，效果接近普通 `pnpm start:dev`。

## 和前面课程的关系

第 5 节学了 HTTP 参数传递。

第 6 节学了 IoC 和依赖注入。

第 7 节的调试能力会把前两节串起来：

- 请求进入 Controller 后，断点能看到参数怎么进入方法。
- Controller 调用 Service 时，断点能看到依赖注入后的对象如何被使用。
- 遇到 CORS、路由不匹配、body 为空、文件上传异常时，可以直接停在代码里看现场。

## 这一节真正要记住的东西

Nest 调试本质上是 Node 调试。

Node 用 `--inspect` 或 `--inspect-brk` 暴露调试服务，Chrome DevTools 或 VS Code 可以连接这个服务。

在 Nest 项目里：

- 临时理解原理：可以用 `pnpm start:debug` + attach。
- 日常开发调试：更推荐 VS Code `launch` 配置直接跑 `pnpm start:dev`。
- 复杂逻辑：优先看断点、作用域、调用栈，不要只堆 `console.log`。
- 临时打印：优先用 Logpoint。
- 特定参数才暂停：用条件断点。
- 找异常源头：用异常断点。

## 下一步

1. 在当前项目配置 VS Code 调试项。
2. 对 `CatsController` 的 GET、POST、文件上传接口分别打断点。
3. 进入第 8 节，学习多种 Provider 和更灵活的注入方式。

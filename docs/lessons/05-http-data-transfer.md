# 05 5 种 HTTP 数据传输方式

## 本节目标

理解前后端通过 HTTP 传递数据的 5 种常见方式，并知道在 Nest Controller 里如何接收它们。

学完这一节，需要能回答：

1. 哪些数据放在 URL 里，哪些数据放在 body 里？
2. `url param` 和 `query` 的区别是什么？
3. `form-urlencoded`、`json`、`form-data` 的 `Content-Type` 分别是什么？
4. Nest 中 `@Param`、`@Query`、`@Body`、`@UploadedFiles` 分别用在什么场景？
5. 文件上传为什么需要 interceptor？

## 5 种传输方式总览

| 方式 | 数据位置 | 常见 Content-Type | Nest 接收方式 | 典型场景 |
| --- | --- | --- | --- | --- |
| URL Param | URL path | 无 | `@Param()` | 资源 id、详情页路径 |
| Query | URL `?` 后 | 无 | `@Query()` | 搜索、分页、筛选 |
| Form Urlencoded | Body | `application/x-www-form-urlencoded` | `@Body()` | 传统表单提交 |
| JSON | Body | `application/json` | `@Body()` | 前后端接口最常用 |
| Form Data | Body | `multipart/form-data` | `@Body()` + `@UploadedFiles()` | 文件上传 |

可以先记一个分组：

- URL 里传：`url param`、`query`
- Body 里传：`form-urlencoded`、`json`、`form-data`

## URL Param

URL Param 是路径的一部分。

示例：

```text
GET /cats/1
```

这里的 `1` 是路径参数，通常代表资源 id。

Nest 写法：

```ts
@Get(':id')
findOne(@Param('id') id: string) {
  return this.catsService.findOne(+id);
}
```

理解点：

- `:id` 声明路径参数。
- `@Param('id')` 读取路径参数。
- 从 URL 取到的参数默认是字符串，需要自己转换类型。

## Query

Query 是 URL 中 `?` 后面的键值对。

示例：

```text
GET /cats/search?name=tom&age=2
```

Nest 写法：

```ts
@Get('search')
search(@Query('name') name: string, @Query('age') age: string) {
  return { name, age: Number(age) };
}
```

理解点：

- `@Query('name')` 读取指定 query 字段。
- query 适合表达搜索条件、分页参数、筛选条件。
- 非英文字符和特殊字符需要 URL 编码。
- axios 的 `params` 配置会帮忙拼 query 并处理编码。

### 路由顺序问题

如果同一个 Controller 里同时有：

```ts
@Get(':id')
findOne() {}

@Get('search')
search() {}
```

`search` 可能会被 `:id` 当成动态参数匹配。

更稳妥的写法是把静态路径放前面：

```ts
@Get('search')
search() {}

@Get(':id')
findOne() {}
```

规则：**更具体的路由放前面，动态路由放后面。**

## Form Urlencoded

Form Urlencoded 是把类似 query string 的内容放进 body。

Content-Type：

```text
application/x-www-form-urlencoded
```

请求体形态：

```text
name=tom&age=2
```

Nest 接收方式：

```ts
@Post()
create(@Body() body: CreateCatDto) {
  return this.catsService.create(body);
}
```

理解点：

- 后端仍然用 `@Body()` 取数据。
- 内容需要 URL 编码。
- 前端如果手动发送，需要用 `qs` 或 `URLSearchParams` 之类工具序列化。
- 适合简单表单，不适合大量数据或文件。

## JSON

JSON 是现代前后端接口最常见的数据格式。

Content-Type：

```text
application/json
```

请求体形态：

```json
{
  "name": "tom",
  "age": 2
}
```

Nest 接收方式和 form-urlencoded 一样：

```ts
@Post()
create(@Body() body: CreateCatDto) {
  return this.catsService.create(body);
}
```

理解点：

- Nest 会根据 `Content-Type` 使用不同 parser。
- 对 Controller 来说，`form-urlencoded` 和 `json` 都可以用 `@Body()` 接收。
- axios 直接传对象时，默认会按 JSON 发送。
- JSON 不适合直接传文件。

## Form Data

Form Data 主要用于上传文件，也可以同时传普通字段。

Content-Type：

```text
multipart/form-data
```

它不是用 `&` 分隔，而是通过 boundary 分隔多个字段。

前端通常使用：

```ts
const data = new FormData();
data.set('name', 'tom');
data.set('age', '2');
data.set('file', file);
```

Nest 中处理文件上传需要 interceptor。

示意写法：

```ts
@Post('file')
@UseInterceptors(AnyFilesInterceptor({ dest: 'uploads/' }))
upload(
  @Body() body: CreateCatDto,
  @UploadedFiles() files: Array<Express.Multer.File>,
) {
  return { body, fileCount: files.length };
}
```

需要的类型依赖：

```bash
pnpm add -D @types/multer
```

理解点：

- 普通字段继续用 `@Body()`。
- 文件字段用 `@UploadedFiles()` 或类似装饰器。
- `AnyFilesInterceptor` 来自 `@nestjs/platform-express`。
- `dest` 可以指定上传文件保存目录。
- `multipart/form-data` 的请求体会包含额外 boundary 信息，体积会比纯 JSON 更大。

## 静态资源

课程里还提到，为了测试前端页面，可以让 Nest 提供静态资源访问。

使用 Express 平台能力时，需要创建应用时指定类型：

```ts
const app = await NestFactory.create<NestExpressApplication>(AppModule);
```

然后启用静态目录：

```ts
app.useStaticAssets('public', { prefix: '/static' });
```

理解点：

- `public` 是静态文件目录。
- `prefix: '/static'` 表示通过 `/static/...` 访问。
- `useStaticAssets` 是 Express 平台扩展能力，所以要使用 `NestExpressApplication` 类型。

本项目后续是否启用静态资源，等实际写前端测试页时再决定。

## 本项目实践计划

第 4 节已经生成了 `cats` 资源，第 5 节可以直接基于它练习。

建议改造方向：

```text
GET    /cats/:id
GET    /cats/search?name=tom&age=2
POST   /cats                 JSON / form-urlencoded
POST   /cats/file            form-data 文件上传
```

需要注意：

- `GET /cats/search` 要放在 `GET /cats/:id` 前面。
- `age` 从 query 或 param 取出来默认是字符串，先手动转数字，后续再学习 Pipe。
- 文件上传会生成本地目录，后续要把上传产物加入 `.gitignore`。

## 验证方式

服务启动：

```bash
pnpm start:dev
```

可以用浏览器、Postman、curl、PowerShell 或前端页面测试。

PowerShell 示例：

```powershell
Invoke-RestMethod "http://localhost:3000/cats/1"
Invoke-RestMethod "http://localhost:3000/cats/search?name=tom&age=2"
```

JSON 请求：

```powershell
Invoke-RestMethod "http://localhost:3000/cats" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name":"tom","age":2}'
```

Form Urlencoded 请求：

```powershell
Invoke-RestMethod "http://localhost:3000/cats" `
  -Method Post `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "name=tom&age=2"
```

文件上传建议后续用浏览器页面或 Postman 测试。

## 这一节真正要记住的东西

HTTP 传参不是只有一种方式，关键是看数据放在哪里、用什么格式编码、后端用什么装饰器接。

- 路径里的资源标识：`@Param()`
- URL 上的搜索条件：`@Query()`
- Body 中的业务对象：`@Body()`
- 文件上传：interceptor + `@UploadedFiles()`

后续学 Pipe、DTO、ValidationPipe 时，会在这一节基础上继续解决“类型转换”和“参数校验”问题。

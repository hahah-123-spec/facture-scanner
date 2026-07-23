# Task 2 Report: Supabase 工具模块（REST API 封装）

## 已完成工作

严格按照任务简报创建了 3 个工具模块：

1. **`miniapp/miniprogram/utils/supabase.js`** — Supabase REST API 封装
   - `getHeaders()` / `api()` 基础请求封装
   - `invoices` 对象：`list`, `getById`, `create`, `update`, `delete`, `checkDuplicate`, `monthlySummary`

2. **`miniapp/miniprogram/utils/auth.js`** — 微信登录 / Token 管理
   - 导出 `getToken`, `getUserId`, `login`, `logout`
   - `getToken()` 被 `app.js` 引用使用，已确认导出正确
   - `login()` 调用微信 wx.login 获取 code，用 Supabase Edge Function 换取 JWT

3. **`miniapp/miniprogram/utils/storage.js`** — 图片上传
   - `uploadImage(filePath, filename)` 上传到 Supabase Storage `invoices` bucket
   - `getPublicUrl(filename)` 获取公开 URL

## 验证

- 文件已正确创建（共 3 个文件，144 行新增代码）
- `auth.js` 正确导出 `getToken`（已被 `app.js` 引用）
- 所有模块使用 CommonJS (`module.exports`) 导出，与微信小程序环境兼容
- 无语法错误（使用 Node.js 语法检查验证）

## 修改的文件

| 文件 | 变更 |
|---|---|
| `miniapp/miniprogram/utils/supabase.js` | 创建 |
| `miniapp/miniprogram/utils/auth.js` | 创建 |
| `miniapp/miniprogram/utils/storage.js` | 创建 |

## 自审

- **完整性**：所有代码与任务简报完全一致，未遗漏任何功能。
- **正确性**：`app.js` 的 `require('./utils/auth')` 与 `getToken` 导出匹配。
- **质量**：代码直接使用微信小程序 wx API 调用 Supabase REST API，没有额外依赖，结构清晰。
- **无问题或疑虑**。

## Commit

`0c019c3` — feat: add Supabase REST API, auth, and storage utilities

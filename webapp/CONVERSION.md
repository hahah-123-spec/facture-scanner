# Web 版转换任务

将微信小程序前端转换为纯网页 SPA（Single Page Application）。

## 架构

- 无构建工具，纯 HTML/CSS/JS
- Hash 路由（`#invoices`, `#scan`, `#report`, `#profile`, `#login`）
- Supabase JS SDK 从 CDN 加载
- 移动端优先，响应式设计
- 保持原版的色彩系统和设计语言

## 色彩系统（保持不变）

```
--paper-white: #FCFAF7
--ink-blue: #1A3A6B
--ink-blue-light: #2D5A9E
--ink-black: #1E1E24
--steel-gray: #6B7280
--paper-texture: #F0EDE6
--pale-ink: #E2DED6
--seal-red: #C2413E
--stamp-green: #1F7D53
--amount-orange: #D4793A
```

## 文件结构

```
webapp/
├── index.html              # 主入口，加载所有 JS
├── css/
│   └── app.css             # 全局样式 + 页面样式
├── js/
│   ├── config.js           # Supabase URL + Anon Key
│   ├── categories.js       # 分类常量（与原来相同）
│   ├── supabase.js         # Supabase 客户端封装
│   ├── auth.js             # 登录/登出逻辑
│   ├── router.js           # Hash 路由
│   └── pages/
│       ├── login.js        # 登录页
│       ├── invoices.js     # 发票列表 + 详情/编辑
│       ├── scan.js         # 拍照录入（核心功能）
│       ├── report.js       # 报表 + CSV 导出
│       └── profile.js      # 设置
├── netlify.toml            # Netlify 部署配置
└── README.md
```

## 微信 API → Web API 对照

| 微信 API | Web 替代 |
|----------|---------|
| `wx.request()` | `fetch()` |
| `wx.chooseImage()` | `<input type="file" accept="image/*" capture="environment">` |
| `wx.setStorageSync()` / `wx.getStorageSync()` | `localStorage.setItem()` / `getItem()` |
| `wx.showToast()` | 自定义 Toast（已提供） |
| `wx.showModal()` | `confirm()` 或自定义弹窗 |
| `wx.showLoading()` / `wx.hideLoading()` | 自定义 Loading 覆盖层 |
| `wx.switchTab()` | `router.navigate('tab')` |
| `wx.navigateTo()` | `router.navigate('page', params)` |
| `wx.navigateBack()` | `router.back()` |
| `wx.getFileSystemManager()` | Blob + `<a>` download |
| `wx.shareFileMessage()` | Blob download |
| `wx.login()` / `wx.getUserProfile()` | Supabase Auth（email/password） |
| `wx.uploadFile()` | `supabase.storage.from().upload()` |
| `Page({})` 生命周期 | 函数式 render/destroy |

## 关键实现细节

### 1. index.html
- Meta viewport for mobile
- 加载 Supabase JS SDK：`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- 加载所有 JS 文件（用 `<script>` 按顺序）
- 底部固定导航栏（4 个 Tab）
- 主内容容器 `<main id="app">`
- 所有页面用 `<div id="page-xxx" class="page">` 显示/隐藏

### 2. CSS (app.css)
- 所有 CSS 变量定义在 `:root`
- 底部导航：固定 bottom:0, 68px 高, flex 4 等分
- 页面：padding-bottom: 80px（留出 Tab 空间）
- 卡片样式：12px 圆角, 阴影, 16px padding
- 按钮：min-height 44px, 8px 圆角
- Toast 组件：fixed bottom, 绿色/红色
- Loading 覆盖层：居中旋转图标
- 模态弹窗：居中 fixed 遮罩
- 全局字体：`-apple-system, 'PingFang SC', 'Segoe UI', sans-serif`

### 3. config.js
```javascript
const CONFIG = {
  supabaseUrl: 'https://uujhooozssitwxqedifa.supabase.co',
  anonKey: 'sb_publishable_4hv0MhC53QLiedOJYwrJ8A_5wnedcPn'
};
```

### 4. categories.js（同原版）
```javascript
const CATEGORIES = [
  { value: 'productos',  label: 'Compra - Productos',   icon: '📦' },
  { value: 'plantas',    label: 'Compra - Plantas/Flores', icon: '🌿' },
  { value: 'suministros',label: 'Agua/Luz/Internet',    icon: '⚡' },
  { value: 'servicios',  label: 'Servicios',            icon: '📋' },
  { value: 'transporte', label: 'Transporte/Envío',     icon: '🚚' },
  { value: 'otros',      label: 'Otros',                icon: '📌' }
];
function getLabel(value) { return (CATEGORIES.find(c => c.value === value) || {}).label || value; }
```

### 5. supabase.js
初始化 Supabase 客户端，封装：
- `supabaseClient` — 全局 Supabase 实例
- `invoices.list({month, search})` — 列表
- `invoices.getById(id)` — 详情
- `invoices.create(data)` — 创建
- `invoices.update(id, data)` — 更新
- `invoices.delete(id)` — 删除
- `invoices.checkDuplicate(supplier, date, amount)` — 重复检测
- OCR 调用：`fetch(CONFIG.supabaseUrl + '/functions/v1/ocr-invoice', { method: 'POST', headers: { apikey, Authorization }, body: JSON.stringify({ image_url }) })`
- 图片上传：`supabaseClient.storage.from('invoices').upload(path, file)`
- 公开 URL：`supabaseClient.storage.from('invoices').getPublicUrl(path)`

### 6. auth.js
- `supabaseClient.auth.signInWithPassword({ email, password })` — 登录
- `supabaseClient.auth.signUp({ email, password })` — 注册
- `supabaseClient.auth.signOut()` — 登出
- `onAuthStateChange` — 监听登录状态
- `getCurrentUser()` — 获取当前用户
- token 存在 Supabase session 里，不需要手动管理

### 7. router.js
- `Router` 对象：`navigate(hash, params)`, `back()`, `getParams()`
- 监听 `window.onhashchange`
- 匹配路由：`login`, `invoices`, `scan`, `report`, `profile`
- 调用对应 page 的 `render(params)` 和 `destroy()`
- 未登录时自动跳 `#login`

### 8. login.js
登录页面：
- 表单：email + password 输入框
- "登录" 按钮（调用 `auth.login()`）
- "注册" 链接（调用 `auth.signUp()`）
- 成功后跳转 `#invoices`
- 出错显示 toast 提示

### 9. invoices.js
发票列表（Tab 1）+ 详情/编辑：
- 列表视图：搜索框 + 月份切换 + 发票卡片列表
- 点击卡片进入详情视图（同一页面切换）
- 详情视图：照片（如有）、字段展示、编辑按钮
- 编辑模式：可编辑字段、分类 picker（`<select>`）、IVA 输入
- 保存/取消/删除按钮
- 渲染 HTML 模板，绑定事件

### 10. scan.js（核心）
拍照录入（Tab 2）：
- 拍照区域：`<input type="file" accept="image/*">` + 相机图标
- 上传到 Supabase Storage
- 调用 OCR Edge Function → 自动填入表单
- 表单字段：supplier_name, invoice_date, base_amount, iva_rate, total_amount, invoice_number, category(select), notes
- 保存前必填校验 + 重复检测弹窗
- 保存成功后清空表单

### 11. report.js
报表（Tab 3）：
- 月份标题 + 左右切换箭头
- 汇总卡片：总金额、Base、IVA、发票张数
- 分类占比条
- 导出 CSV 按钮（生成 Blob → `<a>` download）

### 12. profile.js
设置（Tab 4）：
- 默认 IVA 税率设置（存 localStorage）
- 版本号 v1.0.0
- 退出登录按钮

## 部署

创建 `netlify.toml`：
```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

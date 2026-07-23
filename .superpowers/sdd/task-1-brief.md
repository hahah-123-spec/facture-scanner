# 任务 1：项目脚手架

创建微信小程序项目的所有基础文件。

## 文件清单

### 1. project.config.json
项目根目录 `C:\Users\fengc\source\invoice-scanner\`

```json
{
  "miniprogramRoot": "miniprogram/",
  "appid": "YOUR_APPID",
  "projectname": "invoice-scanner",
  "setting": {
    "es6": true,
    "minified": true,
    "urlCheck": true
  }
}
```

### 2. miniprogram/app.json
注册所有页面 + TabBar 配置。4 个 Tab：发票、录入、报表、我的。

### 3. miniprogram/app.js
全局入口，检查登录状态，存储 supabaseUrl 和 anonKey（用占位符）。使用 `./utils/auth` 的 getToken()。

### 4. miniprogram/app.wxss
CSS 变量定义（精确值）：
- --paper-white: #FCFAF7
- --ink-blue: #1A3A6B
- --ink-blue-light: #2D5A9E
- --ink-black: #1E1E24
- --steel-gray: #6B7280
- --paper-texture: #F0EDE6
- --pale-ink: #E2DED6
- --seal-red: #C2413E
- --stamp-green: #1F7D53

全局类：.amount-large(22px bold), .text-title(16px), .text-body(14px), .text-caption(12px), .card, .btn-primary, .btn-danger, .toast-success

### 5. miniprogram/utils/categories.js
6 个分类常量数组 + getLabel() 函数。值：productos, plantas, suministros, servicios, transporte, otros

### 6. README.md
项目名"发票扫描管理工具"，一句话描述。

## 全局约束
- 所有颜色使用 CSS 变量的精确值（见上方）
- 分类值必须精确：productos, plantas, suministros, servicios, transporte, otros
- app.json pages 数组必须包含所有 6 个页面路径
- 按钮最小高度 44px（.btn-primary, .btn-danger）

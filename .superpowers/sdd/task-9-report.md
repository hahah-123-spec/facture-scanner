# 任务 9：报表页（Tab 3）+ Excel 导出

## 完成情况

创建了报表页所需的 4 个文件：

### 文件列表

| 文件 | 说明 |
|------|------|
| `miniapp/miniprogram/pages/report/index.js` | 页面逻辑：月度数据加载、分类汇总、CSV 导出 |
| `miniapp/miniprogram/pages/report/index.wxml` | 模板：汇总卡片 + 分类占比条 + 导出按钮 |
| `miniapp/miniprogram/pages/report/index.wxss` | 样式：遵循项目设计系统（CSS 变量） |
| `miniapp/miniprogram/pages/report/index.json` | 页面配置：标题 "月度报表" |

### 功能

1. **月度汇总卡片**：显示当前月份总金额（大号）、Base、IVA、发票张数
2. **分类占比**：使用 `CATEGORIES` 常量遍历，以色块条展示每个分类的金额占比
3. **CSV 导出**：从 `invoices.list({ month })` 拉取数据，生成 CSV 文件，通过 `wx.shareFileMessage` 分享
   - CSV 列：Fecha, Proveedor, Nº Factura, Base, IVA%, IVA, Total, Categoría

### 页面注册

已在 `app.json` 中注册为 Tab 3（路径 `pages/report/index`）。

### Commit

`19f077a` - `feat: add report page with monthly summary and CSV export`

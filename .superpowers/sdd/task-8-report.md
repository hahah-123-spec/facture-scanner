# Task 8: 拍照录入页（Tab 2）- 完成报告

## 创建的文件

| 文件 | 说明 |
|------|------|
| `miniapp/miniprogram/pages/scan/add.js` | 页面逻辑：拍照、OCR、表单校对、重复检测、保存 |
| `miniapp/miniprogram/pages/scan/add.wxml` | 页面模板：拍照区、预览、OCR加载、表单 |
| `miniapp/miniprogram/pages/scan/add.wxss` | 样式：拍照区域、预览、OCR动画、表单字段 |
| `miniapp/miniprogram/pages/scan/add.json` | 页面配置：标题 "拍照录入" |

## 功能覆盖

1. **拍照/选图** - `wx.chooseImage` 同时支持相机和相册，压缩模式
2. **图片上传** - 上传到 Supabase Storage `incoming/` 目录
3. **OCR 识别** - 调用 `/functions/v1/ocr-invoice`，返回字段自动填入表单
4. **表单校对** - 所有字段可编辑，支持数字键盘 (`type="digit"`)
5. **分类选择** - 使用 `categories.js` 中的 CATEGORIES，picker 组件
6. **重复检测** - 保存时调用 `invoices.checkDuplicate()`，重复则弹窗提示
7. **保存** - 必填字段校验（供应商、日期、金额），通过 `invoices.create()` 写入

## 实现细节

- 引入 `CATEGORIES` 统一分类数据源，避免硬编码重复
- `categoryIndex` 追踪 picker 当前选中项，确保 label 显示正确
- 保存成功后清空表单并重置照片状态
- `app.json` 中 Tab 2 已配置为 `"pagePath": "pages/scan/add"`（此前已完成）

## Commit

```
3804e30 feat: add scan page with camera, OCR, and duplicate detection
```

# 任务 3 报告：Supabase 后端 — 数据库 + Edge Functions

## 状态：DONE

## 创建的提交

- `370e1f1` feat: add database migration, wechat-login and ocr edge functions

## 创建的文件

| 文件 | 行数 | 说明 |
|------|------|------|
| `supabase/migrations/001_create_invoices.sql` | 46 | 建表、RLS、存储桶、monthly_summary 函数 |
| `supabase/functions/wechat-login/index.ts` | 33 | 微信登录 Edge Function |
| `supabase/functions/ocr-invoice/index.ts` | 65 | OCR Edge Function（Google Cloud Vision） |

## 验证结果

- 三个文件均已创建并可读
- TypeScript 文件花括号平衡检查通过（无语法级问题）
- 提交成功，3 个文件共 168 行变更

## 疑虑

- Edge Functions 依赖 `Deno.env.get()` 获取环境变量，需在 Supabase Dashboard 手动设置 `WX_APPID`、`WX_SECRET`、`GOOGLE_VISION_API_KEY`
- SFTP/SCP 部署命令（`supabase functions deploy`）未执行，因为当前环境无 Supabase CLI 及对应项目连接
- `monthly_summary` 函数返回混合行（汇总 + 分类），调用方需要区分 `category IS NULL` 的行（汇总）和 `category IS NOT NULL` 的行（分类汇总）

## 报告文件路径

`C:\Users\fengc\source\invoice-scanner\.superpowers\sdd\task-3-report.md`

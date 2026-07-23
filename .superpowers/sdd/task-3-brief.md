## ### 任务 3：Supabase 后端 — 数据库 + Edge Functions

**文件：**
- 创建：`supabase/migrations/001_create_invoices.sql`
- 创建：`supabase/functions/wechat-login/index.ts`
- 创建：`supabase/functions/ocr-invoice/index.ts`

- [ ] **步骤 1：编写数据库迁移 SQL**

```sql
-- supabase/migrations/001_create_invoices.sql
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  supplier_name text NOT NULL,
  supplier_nif text,
  invoice_number text,
  invoice_date date NOT NULL,
  base_amount numeric(10,2) NOT NULL,
  iva_rate numeric(5,2) DEFAULT 21.00,
  iva_amount numeric(10,2) GENERATED ALWAYS AS (base_amount * iva_rate / 100) STORED,
  total_amount numeric(10,2) NOT NULL,
  category text DEFAULT 'productos',
  image_url text,
  entered_by text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared access" ON invoices FOR ALL USING (true);

-- 存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);
CREATE POLICY "Public invoice images" ON storage.objects FOR ALL USING (bucket_id = 'invoices');

-- 月度汇总函数
CREATE OR REPLACE FUNCTION monthly_summary(p_month text)
RETURNS TABLE(
  total_base numeric, total_iva numeric, total_amount numeric, invoice_count bigint,
  category text, cat_total numeric
) LANGUAGE sql AS $$
  SELECT
    SUM(base_amount) AS total_base,
    SUM(iva_amount) AS total_iva,
    SUM(total_amount) AS total_amount,
    COUNT(*) AS invoice_count,
    NULL::text AS category,
    NULL::numeric AS cat_total
  FROM invoices
  WHERE invoice_date >= (p_month || '-01')::date
    AND invoice_date < ((p_month || '-01')::date + INTERVAL '1 month')
  UNION ALL
  SELECT NULL, NULL, NULL, NULL, category, SUM(total_amount)
  FROM invoices
  WHERE invoice_date >= (p_month || '-01')::date
    AND invoice_date < ((p_month || '-01')::date + INTERVAL '1 month')
  GROUP BY category;
$$;
```

- [ ] **步骤 2：编写微信登录 Edge Function**

```typescript
// supabase/functions/wechat-login/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { code } = await req.json();
  if (!code) return new Response(JSON.stringify({ error: 'missing code' }), { status: 400 });

  // 1. 用 code 换 openid（调用微信 API）
  const wxRes = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${Deno.env.get('WX_APPID')}&secret=${Deno.env.get('WX_SECRET')}&js_code=${code}&grant_type=authorization_code`
  );
  const wxData = await wxRes.json();
  if (!wxData.openid) return new Response(JSON.stringify({ error: 'wechat auth failed' }), { status: 401 });

  // 2. 在 Supabase 创建/查找用户（以 openid 为 email）
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const email = `${wxData.openid}@wechat.user`;
  const password = wxData.openid;

  let { data: existing } = await supabase.auth.admin.listUsers();
  let user = existing?.users?.find(u => u.email === email);

  if (!user) {
    const { data: created } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    user = created.user;
  }

  // 3. 生成 JWT
  const { data: signIn } = await supabase.auth.signInWithPassword({ email, password });

  return new Response(JSON.stringify({
    access_token: signIn.session.access_token,
    user_id: user.id
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

- [ ] **步骤 3：编写 OCR Edge Function**

```typescript
// supabase/functions/ocr-invoice/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { image_url } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. 从 Storage 下载图片
  const { data: imageData } = await supabase.storage
    .from('invoices')
    .download(image_url);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(await imageData.arrayBuffer())));

  // 2. 调用 Google Cloud Vision
  const visionRes = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${Deno.env.get('GOOGLE_VISION_API_KEY')}`,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: 'TEXT_DETECTION' }]
        }]
      })
    }
  );
  const visionData = await visionRes.json();
  const text = visionData.responses?.[0]?.fullTextAnnotation?.text || '';

  // 3. 从文本中提取字段
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 供应商：第一行大写文本
  const supplier_name = lines.find(l => /^[A-Z][A-zÀ-ÿ\s]{3,}$/.test(l)) || '';

  // 日期：匹配 dd/mm/yyyy
  const dateMatch = text.match(/(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/);
  const invoice_date = dateMatch ? dateMatch[1].replace(/\./g, '/') : '';

  // 金额提取
  const amounts = text.match(/(\d+[.,]\d{2})\s*€?/g) || [];
  const parsed = amounts.map(a => parseFloat(a.replace(',', '.').replace('€', ''))).filter(n => !isNaN(n));

  let total_amount = 0, base_amount = 0, iva_amount = 0;

  // Total: 最大金额或 "TOTAL" 后的金额
  const totalLine = lines.find(l => /TOTAL|IMPORTE\s*TOTAL/i.test(l));
  if (totalLine) {
    const m = totalLine.match(/(\d+[.,]\d{2})/);
    if (m) total_amount = parseFloat(m[1].replace(',', '.'));
  }
  if (!total_amount && parsed.length > 0) total_amount = Math.max(...parsed);

  // Base: IVA 行之前的金额
  const baseIdx = lines.findIndex(l => /IVA|21%|10%|4%/i.test(l));
  if (baseIdx > 0) {
    const bm = lines[baseIdx - 1].match(/(\d+[.,]\d{2})/);
    if (bm) base_amount = parseFloat(bm[1].replace(',', '.'));
  }
  if (!base_amount && total_amount) base_amount = Math.round(total_amount / 1.21 * 100) / 100;

  // IVA: total - base
  iva_amount = Math.round((total_amount - base_amount) * 100) / 100;

  // 发票号
  const numMatch = text.match(/(?:FACTURA|N[º°]|FRA\.?)\s*[:#]?\s*([A-Z0-9\-]{4,20})/i);
  const invoice_number = numMatch ? numMatch[1] : '';

  return new Response(JSON.stringify({
    supplier_name, invoice_date, base_amount: base_amount,
    iva_amount, total_amount, invoice_number
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

- [ ] **步骤 4：部署 Edge Functions 并设置环境变量**

```bash
# 在 Supabase Dashboard 设置环境变量：
# WX_APPID, WX_SECRET, GOOGLE_VISION_API_KEY

# 部署
cd supabase
supabase functions deploy wechat-login
supabase functions deploy ocr-invoice
```

- [ ] **步骤 5：Commit**

```bash
git add supabase/ && git commit -m "feat: add database migration, wechat-login and ocr edge functions"
```

---



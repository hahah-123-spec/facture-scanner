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

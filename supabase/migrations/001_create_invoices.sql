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

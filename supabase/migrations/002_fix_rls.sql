-- Fix RLS: ensure each user only sees their own invoices
-- Was: auth.role() = 'authenticated' (any logged-in user sees ALL)
-- Now: user_id = auth.uid() (each user sees only their own)

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop old policy if exists
DROP POLICY IF EXISTS "Allow authenticated access" ON invoices;

-- Create policy: each user sees/edits only their own invoices
CREATE POLICY "Users can access their own invoices" ON invoices
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

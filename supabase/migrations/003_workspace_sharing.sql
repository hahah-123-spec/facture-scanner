-- Shared workspace support for multi-user shops
-- Each shop = one workspace with a shareable invite code

-- 1. Create profiles table linking users to workspaces
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,  -- 6-char code to share with coworkers
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add workspace_id to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- 3. Create default workspace for existing users + backfill invoices
DO $$
DECLARE
  usr RECORD;
  ws_id UUID;
  ws_code TEXT;
BEGIN
  FOR usr IN SELECT id FROM auth.users
  LOOP
    -- Only if user doesn't have a profile yet
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = usr.id) THEN
      ws_id := gen_random_uuid();
      ws_code := upper(substring(replace(ws_id::text, '-', ''), 1, 6));
      INSERT INTO profiles (user_id, workspace_id, invite_code) VALUES (usr.id, ws_id, ws_code);
      -- Assign existing invoices to this workspace
      UPDATE invoices SET workspace_id = ws_id WHERE user_id = usr.id AND workspace_id IS NULL;
    END IF;
  END LOOP;
END $$;

-- 4. Auto-create profile for new signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ws_id UUID;
  ws_code TEXT;
BEGIN
  ws_id := gen_random_uuid();
  ws_code := upper(substring(replace(ws_id::text, '-', ''), 1, 6));
  INSERT INTO profiles (user_id, workspace_id, invite_code) VALUES (NEW.id, ws_id, ws_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Function to join an existing workspace by invite code
CREATE OR REPLACE FUNCTION join_workspace(p_invite_code TEXT)
RETURNS UUID AS $$
DECLARE
  target_ws UUID;
BEGIN
  SELECT workspace_id INTO target_ws FROM profiles WHERE invite_code = upper(p_invite_code);
  IF target_ws IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;
  -- Update current user's profile to point to target workspace
  UPDATE profiles SET workspace_id = target_ws WHERE user_id = auth.uid();
  RETURN target_ws;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Drop old RLS and create workspace-based policy
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'invoices'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON invoices', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "workspace_members" ON invoices
  FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (workspace_id = (SELECT workspace_id FROM profiles WHERE user_id = auth.uid()));

-- 7. Ensure workspace_id is set on all future inserts
ALTER TABLE invoices ALTER COLUMN workspace_id SET NOT NULL;

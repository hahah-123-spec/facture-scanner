-- Fix: proper admin/member roles

-- 1. Reset all to member first
UPDATE profiles SET role = 'member';

-- 2. Only the FIRST user in each workspace is admin
UPDATE profiles p SET role = 'admin'
WHERE p.user_id = (
  SELECT user_id FROM profiles
  WHERE workspace_id = p.workspace_id
  ORDER BY created_at LIMIT 1
);

-- 3. Fix trigger: new user = admin (org owns their own shop until they join another)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE ws_id UUID; ws_code TEXT;
BEGIN
  ws_id := gen_random_uuid();
  ws_code := upper(substring(replace(ws_id::text, '-', ''), 1, 6));
  INSERT INTO profiles (user_id, workspace_id, invite_code, role)
  VALUES (NEW.id, ws_id, ws_code, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Fix join: joining members become 'member' (not admin)
CREATE OR REPLACE FUNCTION join_workspace(p_invite_code TEXT)
RETURNS UUID AS $$
DECLARE target_ws UUID;
BEGIN
  SELECT workspace_id INTO target_ws FROM profiles WHERE invite_code = upper(p_invite_code);
  IF target_ws IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
  UPDATE profiles SET workspace_id = target_ws, role = 'member' WHERE user_id = auth.uid();
  RETURN target_ws;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

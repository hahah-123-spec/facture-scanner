-- Member management for workspaces

-- 1. Add role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- 2. First user in each workspace becomes admin
UPDATE profiles SET role = 'admin' WHERE workspace_id IN (
  SELECT workspace_id FROM profiles GROUP BY workspace_id HAVING min(created_at) = created_at
) AND role = 'member';

-- 3. List workspace members (RPC)
CREATE OR REPLACE FUNCTION get_workspace_members()
RETURNS TABLE(member_email TEXT, member_id UUID, member_role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT au.email::TEXT, p.user_id, p.role
  FROM profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE p.workspace_id = (SELECT workspace_id FROM profiles WHERE user_id = auth.uid())
  ORDER BY p.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Remove member from workspace (admin only)
CREATE OR REPLACE FUNCTION remove_member(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  new_ws UUID;
  new_code TEXT;
  admin_role TEXT;
BEGIN
  SELECT role INTO admin_role FROM profiles WHERE user_id = auth.uid();
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Only admin can remove members';
  END IF;
  new_ws := gen_random_uuid();
  new_code := upper(substring(replace(new_ws::text, '-', ''), 1, 6));
  UPDATE profiles SET workspace_id = new_ws, invite_code = new_code WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

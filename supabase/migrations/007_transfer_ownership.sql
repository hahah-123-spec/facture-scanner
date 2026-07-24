-- Transfer ownership + restrict admin from leaving

-- 1. Transfer ownership to another member
CREATE OR REPLACE FUNCTION transfer_ownership(p_new_admin_id UUID)
RETURNS VOID AS $$
DECLARE
  current_role TEXT;
  target_ws UUID;
  current_ws UUID;
BEGIN
  -- Check current user is admin
  SELECT role INTO current_role FROM profiles WHERE user_id = auth.uid();
  IF current_role != 'admin' THEN
    RAISE EXCEPTION 'Only admin can transfer ownership';
  END IF;

  -- Get current workspace
  SELECT workspace_id INTO current_ws FROM profiles WHERE user_id = auth.uid();

  -- Check target is in same workspace
  SELECT workspace_id INTO target_ws FROM profiles WHERE user_id = p_new_admin_id;
  IF target_ws IS NULL OR target_ws != current_ws THEN
    RAISE EXCEPTION 'Member not in your workspace';
  END IF;

  -- Transfer: current admin → member, target member → admin
  UPDATE profiles SET role = 'member' WHERE user_id = auth.uid();
  UPDATE profiles SET role = 'admin' WHERE user_id = p_new_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update leave_workspace: block admin if other members exist
CREATE OR REPLACE FUNCTION leave_workspace()
RETURNS UUID AS $$
DECLARE
  new_ws UUID;
  new_code TEXT;
  current_role TEXT;
  member_count INT;
BEGIN
  SELECT role INTO current_role FROM profiles WHERE user_id = auth.uid();

  IF current_role = 'admin' THEN
    -- Check if there are other members
    SELECT COUNT(*) INTO member_count
    FROM profiles
    WHERE workspace_id = (SELECT workspace_id FROM profiles WHERE user_id = auth.uid())
      AND user_id != auth.uid();

    IF member_count > 0 THEN
      RAISE EXCEPTION 'Debes transferir la tienda a otro miembro antes de salir';
    END IF;
  END IF;

  new_ws := gen_random_uuid();
  new_code := upper(substring(replace(new_ws::text, '-', ''), 1, 6));
  UPDATE profiles SET workspace_id = new_ws, invite_code = new_code WHERE user_id = auth.uid();
  RETURN new_ws;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

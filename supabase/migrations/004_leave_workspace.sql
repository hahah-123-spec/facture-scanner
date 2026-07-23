-- 5. Function to leave current workspace and create a new one
CREATE OR REPLACE FUNCTION leave_workspace()
RETURNS UUID AS $$
DECLARE
  new_ws UUID;
  new_code TEXT;
BEGIN
  new_ws := gen_random_uuid();
  new_code := upper(substring(replace(new_ws::text, '-', ''), 1, 6));
  UPDATE profiles SET workspace_id = new_ws, invite_code = new_code WHERE user_id = auth.uid();
  RETURN new_ws;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

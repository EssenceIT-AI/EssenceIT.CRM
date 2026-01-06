-- Create a security definer function to create organization and add owner atomically
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  _name text,
  _user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  -- Create the organization
  INSERT INTO public.organizations (name)
  VALUES (_name)
  RETURNING id INTO _org_id;
  
  -- Add the user as owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (_org_id, _user_id, 'owner');
  
  -- Update user's last_organization_id
  UPDATE public.profiles
  SET last_organization_id = _org_id
  WHERE id = _user_id;
  
  RETURN _org_id;
END;
$$;
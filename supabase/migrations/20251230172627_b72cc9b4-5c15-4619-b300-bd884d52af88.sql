-- Create invites table
CREATE TABLE public.organization_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Org members can view invites"
  ON public.organization_invites
  FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org owners can create invites"
  ON public.organization_invites
  FOR INSERT
  WITH CHECK (is_org_owner(auth.uid(), organization_id));

CREATE POLICY "Org owners can delete invites"
  ON public.organization_invites
  FOR DELETE
  USING (is_org_owner(auth.uid(), organization_id));

-- Users can view their own pending invites by email
CREATE POLICY "Users can view their own invites"
  ON public.organization_invites
  FOR SELECT
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Function to accept invite
CREATE OR REPLACE FUNCTION public.accept_organization_invite(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite record;
  _user_id uuid;
  _user_email text;
BEGIN
  _user_id := auth.uid();
  
  -- Get user email
  SELECT email INTO _user_email FROM public.profiles WHERE id = _user_id;
  
  -- Find valid invite
  SELECT * INTO _invite 
  FROM public.organization_invites 
  WHERE token = _token 
    AND email = _user_email
    AND accepted_at IS NULL 
    AND expires_at > now();
  
  IF _invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite inválido ou expirado');
  END IF;
  
  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = _user_id AND organization_id = _invite.organization_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já é membro desta organização');
  END IF;
  
  -- Add as member
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (_invite.organization_id, _user_id, _invite.role);
  
  -- Mark invite as accepted
  UPDATE public.organization_invites 
  SET accepted_at = now() 
  WHERE id = _invite.id;
  
  -- Update user's last organization
  UPDATE public.profiles 
  SET last_organization_id = _invite.organization_id 
  WHERE id = _user_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'organization_id', _invite.organization_id
  );
END;
$$;
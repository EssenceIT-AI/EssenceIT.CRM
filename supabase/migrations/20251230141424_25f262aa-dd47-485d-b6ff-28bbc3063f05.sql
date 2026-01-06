-- Drop existing problematic policies on organization_members
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON public.organization_members;

-- Create a security definer function to check membership without recursion
CREATE OR REPLACE FUNCTION public.check_org_membership(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- Create a security definer function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND role = 'owner'
  )
$$;

-- Recreate policies using the security definer functions
CREATE POLICY "Users can view members of their organizations"
  ON public.organization_members FOR SELECT
  USING (public.check_org_membership(auth.uid(), organization_id));

CREATE POLICY "Organization owners can manage members"
  ON public.organization_members FOR DELETE
  USING (public.is_org_owner(auth.uid(), organization_id));

CREATE POLICY "Users can insert themselves as members"
  ON public.organization_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Also fix the organizations table policies that have the same issue
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;

CREATE POLICY "Users can view organizations they are members of"
  ON public.organizations FOR SELECT
  USING (public.check_org_membership(auth.uid(), id));

CREATE POLICY "Organization owners can update"
  ON public.organizations FOR UPDATE
  USING (public.is_org_owner(auth.uid(), id));
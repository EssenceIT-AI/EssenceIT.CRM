-- Create the update_updated_at_column function FIRST
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create negocios table
CREATE TABLE public.negocios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  props JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create negocios_schema table
CREATE TABLE public.negocios_schema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocios_schema ENABLE ROW LEVEL SECURITY;

-- Helper function to check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
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

-- Negocios policies
CREATE POLICY "Users can view negocios of their orgs"
  ON public.negocios FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can insert negocios to their orgs"
  ON public.negocios FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can update negocios of their orgs"
  ON public.negocios FOR UPDATE
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can delete negocios of their orgs"
  ON public.negocios FOR DELETE
  USING (public.is_org_member(auth.uid(), organization_id));

-- Schema policies
CREATE POLICY "Users can view schema of their orgs"
  ON public.negocios_schema FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can insert schema for their orgs"
  ON public.negocios_schema FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can update schema of their orgs"
  ON public.negocios_schema FOR UPDATE
  USING (public.is_org_member(auth.uid(), organization_id));

-- Indexes
CREATE INDEX idx_negocios_org ON public.negocios(organization_id);
CREATE INDEX idx_negocios_owner ON public.negocios(owner_id);

-- Triggers for updated_at
CREATE TRIGGER update_negocios_updated_at
  BEFORE UPDATE ON public.negocios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_negocios_schema_updated_at
  BEFORE UPDATE ON public.negocios_schema
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
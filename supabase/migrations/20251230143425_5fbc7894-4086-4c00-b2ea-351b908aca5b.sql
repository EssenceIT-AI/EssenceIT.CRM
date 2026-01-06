
-- Create companies table
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text,
  industry text,
  size text,
  country text,
  city text,
  owner_id uuid,
  props jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS policies for companies
CREATE POLICY "Users can view companies of their orgs"
  ON public.companies FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can insert companies to their orgs"
  ON public.companies FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can update companies of their orgs"
  ON public.companies FOR UPDATE
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can delete companies of their orgs"
  ON public.companies FOR DELETE
  USING (is_org_member(auth.uid(), organization_id));

-- Create contacts table
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  position text,
  owner_id uuid,
  props jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts
CREATE POLICY "Users can view contacts of their orgs"
  ON public.contacts FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can insert contacts to their orgs"
  ON public.contacts FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can update contacts of their orgs"
  ON public.contacts FOR UPDATE
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can delete contacts of their orgs"
  ON public.contacts FOR DELETE
  USING (is_org_member(auth.uid(), organization_id));

-- Create processes table
CREATE TABLE public.processes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  select_field_key text NOT NULL,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  transitions jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for processes
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

-- RLS policies for processes
CREATE POLICY "Users can view processes of their orgs"
  ON public.processes FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can insert processes to their orgs"
  ON public.processes FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can update processes of their orgs"
  ON public.processes FOR UPDATE
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can delete processes of their orgs"
  ON public.processes FOR DELETE
  USING (is_org_member(auth.uid(), organization_id));

-- Create dashboards table
CREATE TABLE public.dashboards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  filters jsonb DEFAULT '{}'::jsonb,
  widget_order jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Enable RLS for dashboards
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

-- RLS policies for dashboards
CREATE POLICY "Users can view dashboards of their orgs"
  ON public.dashboards FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can insert dashboards to their orgs"
  ON public.dashboards FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can update dashboards of their orgs"
  ON public.dashboards FOR UPDATE
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can delete dashboards of their orgs"
  ON public.dashboards FOR DELETE
  USING (is_org_member(auth.uid(), organization_id));

-- Create indexes for better performance
CREATE INDEX idx_companies_org ON public.companies(organization_id);
CREATE INDEX idx_contacts_org ON public.contacts(organization_id);
CREATE INDEX idx_contacts_company ON public.contacts(company_id);
CREATE INDEX idx_processes_org ON public.processes(organization_id);
CREATE INDEX idx_processes_active ON public.processes(organization_id, select_field_key, is_active) WHERE is_active = true;
CREATE INDEX idx_dashboards_org ON public.dashboards(organization_id);
CREATE INDEX idx_dashboards_slug ON public.dashboards(organization_id, slug);

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processes_updated_at
  BEFORE UPDATE ON public.processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

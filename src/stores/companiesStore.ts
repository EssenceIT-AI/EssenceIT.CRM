import { create } from "zustand";
import { companiesRepo, Company, CompanyCreate, CompanyPatch } from "@/data/companiesRepo";

interface CompaniesState {
  companies: Company[];
  loading: boolean;
  error: string | null;
  lastOrgId: string | null;

  // Actions
  loadCompanies: (orgId: string) => Promise<void>;
  getCompany: (id: string) => Company | undefined;
  createCompany: (orgId: string, data: Omit<CompanyCreate, 'organization_id'>) => Promise<Company>;
  updateCompany: (id: string, patch: CompanyPatch) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;
  reset: () => void;

  // Table compatibility
  asTableRows: () => Record<string, unknown>[];
}

export const useCompaniesStore = create<CompaniesState>()((set, get) => ({
  companies: [],
  loading: false,
  error: null,
  lastOrgId: null,

  loadCompanies: async (orgId: string) => {
    // Skip if already loaded for this org
    if (get().lastOrgId === orgId && get().companies.length > 0) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const companies = await companiesRepo.list(orgId);
      set({ companies, loading: false, lastOrgId: orgId });
    } catch (error) {
      console.error("Error loading companies:", error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  getCompany: (id: string) => {
    return get().companies.find((c) => c.id === id);
  },

  createCompany: async (orgId: string, data) => {
    const company = await companiesRepo.create({
      ...data,
      organization_id: orgId,
    });

    set((state) => ({
      companies: [company, ...state.companies],
    }));

    return company;
  },

  updateCompany: async (id: string, patch: CompanyPatch) => {
    // Optimistic update
    const previousCompanies = get().companies;
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, ...patch, updated_at: new Date().toISOString() } : c
      ),
    }));

    try {
      const updated = await companiesRepo.update(id, patch);
      set((state) => ({
        companies: state.companies.map((c) => (c.id === id ? updated : c)),
      }));
      return updated;
    } catch (error) {
      // Rollback on error
      set({ companies: previousCompanies });
      throw error;
    }
  },

  deleteCompany: async (id: string) => {
    const previousCompanies = get().companies;
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== id),
    }));

    try {
      await companiesRepo.delete(id);
    } catch (error) {
      set({ companies: previousCompanies });
      throw error;
    }
  },

  reset: () => {
    set({ companies: [], loading: false, error: null, lastOrgId: null });
  },

  asTableRows: () => {
    return get().companies.map((c) => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      industry: c.industry,
      size: c.size,
      country: c.country,
      city: c.city,
      ownerId: c.owner_id,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      ...c.props,
    }));
  },
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { httpClient } from "@/lib/httpClient";

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface OrganizationState {
  organizations: Organization[];
  activeOrganizationId: string | null;
  loading: boolean;
  
  // Actions
  loadOrganizations: (userId: string) => Promise<void>;
  setActiveOrganization: (id: string, userId?: string) => Promise<void>;
  createOrganization: (name: string, userId: string) => Promise<{ success: boolean; error?: string; organizationId?: string }>;
  reset: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      organizations: [],
      activeOrganizationId: null,
      loading: false,

      loadOrganizations: async (userId: string) => {
        set({ loading: true });
        
        try {
          const response = await httpClient.get<Organization[]>("/organizations");
          
          if (response.error) {
            console.error("Error loading organizations:", response.error);
            set({ loading: false });
            return;
          }

          const orgs = response.data || [];
          const orgIds = orgs.map(o => o.id);

          const currentActive = get().activeOrganizationId;
          let activeId = currentActive;

          // Priority: current active -> first org
          if (!activeId || !orgIds.includes(activeId)) {
            if (orgs && orgs.length > 0) {
              activeId = orgs[0].id;
            }
          }

          set({ 
            organizations: orgs, 
            activeOrganizationId: activeId,
            loading: false 
          });
        } catch (error) {
          console.error("Error loading organizations:", error);
          set({ loading: false });
        }
      },

      setActiveOrganization: async (id: string, userId?: string) => {
        set({ activeOrganizationId: id });

        // Persist to profile if userId provided
        if (userId) {
          await httpClient.put("/organizations/active", { organization_id: id });
        }
      },

      createOrganization: async (name: string, userId: string) => {
        set({ loading: true });

        try {
          const response = await httpClient.post<Organization>("/organizations", { name });

          if (response.error || !response.data) {
            console.error("Error creating organization:", response.error);
            set({ loading: false });
            return { success: false, error: response.error || "Erro ao criar organização" };
          }

          const org = response.data;
          const currentOrgs = get().organizations;
          set({ 
            organizations: [...currentOrgs, org],
            activeOrganizationId: org.id,
            loading: false 
          });

          return { success: true, organizationId: org.id };
        } catch (error) {
          console.error("Error creating organization:", error);
          set({ loading: false });
          return { success: false, error: "Erro ao criar organização" };
        }
      },

      reset: () => {
        set({ organizations: [], activeOrganizationId: null, loading: false });
      },
    }),
    {
      name: "crm-organization",
      partialize: (state) => ({
        activeOrganizationId: state.activeOrganizationId,
      }),
    }
  )
);

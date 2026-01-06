import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Company, Contact, Deal, TableRow, User, Role } from "@/types";
import { mockCompanies, mockContacts, mockDeals, mockUsers, mockRoles, mockConfigs } from "@/mocks/data";
import { useAuthStore } from "./authStore";

export interface Config {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string;
  createdAt: string;
}

interface DataState {
  deals: Deal[];
  companies: Company[];
  contacts: Contact[];
  users: User[];
  roles: Role[];
  configs: Config[];
  
  // Deal actions
  getDeals: () => Deal[];
  getDeal: (id: string) => Deal | undefined;
  createDeal: (deal: Omit<Deal, "id" | "createdAt">) => Deal;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  
  // Company actions
  getCompanies: () => Company[];
  getCompany: (id: string) => Company | undefined;
  createCompany: (company: Omit<Company, "id" | "createdAt" | "updatedAt">) => Company;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  
  // Contact actions
  getContacts: () => Contact[];
  getContact: (id: string) => Contact | undefined;
  createContact: (contact: Omit<Contact, "id" | "createdAt" | "updatedAt">) => Contact;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  
  // User actions
  getUsers: () => User[];
  getUser: (id: string) => User | undefined;
  createUser: (user: Omit<User, "id" | "createdAt" | "updatedAt">) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Role actions
  getRoles: () => Role[];
  getRole: (id: string) => Role | undefined;
  createRole: (role: Omit<Role, "id">) => Role;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  
  // Config actions
  getConfigs: () => Config[];
  getConfig: (id: string) => Config | undefined;
  createConfig: (config: Omit<Config, "id" | "createdAt">) => Config;
  updateConfig: (id: string, updates: Partial<Config>) => void;
  deleteConfig: (id: string) => void;
  
  // Generic row operations for dynamic tables
  getTableData: (tableId: string) => TableRow[];
  updateRow: (tableId: string, rowId: string, updates: Record<string, unknown>) => void;
  
  // Data management
  reseedData: () => void;
}

// Helper to filter by company scope
const filterByCompanyScope = <T extends { companyId?: string; ownerId?: string }>(
  items: T[],
  companyScope: string[]
): T[] => {
  if (companyScope.length === 0) return items;
  return items.filter(item => {
    if (item.companyId && companyScope.includes(item.companyId)) return true;
    // For items without companyId, check owner's company scope
    return true; // Simplified - in real app would check owner
  });
};

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      deals: mockDeals,
      companies: mockCompanies,
      contacts: mockContacts,
      users: mockUsers,
      roles: mockRoles,
      configs: mockConfigs,

      // Deals
      getDeals: () => {
        const authStore = useAuthStore.getState();
        const user = authStore.user;
        if (!user) return [];
        
        // Admin sees all
        if (user.roleId === "role-admin") return get().deals;
        
        // Filter by company scope
        return get().deals.filter(deal => 
          user.companyScope.length === 0 || 
          user.companyScope.includes(deal.companyId)
        );
      },

      getDeal: (id) => get().deals.find(d => d.id === id),

      createDeal: (deal) => {
        const newDeal: Deal = {
          ...deal,
          id: `deal-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ deals: [...state.deals, newDeal] }));
        return newDeal;
      },

      updateDeal: (id, updates) => {
        set(state => ({
          deals: state.deals.map(d => 
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      deleteDeal: (id) => {
        set(state => ({
          deals: state.deals.filter(d => d.id !== id),
        }));
      },

      // Companies
      getCompanies: () => {
        const authStore = useAuthStore.getState();
        const user = authStore.user;
        if (!user) return [];
        
        if (user.roleId === "role-admin") return get().companies;
        
        return get().companies.filter(c => 
          user.companyScope.length === 0 || 
          user.companyScope.includes(c.id)
        );
      },

      getCompany: (id) => get().companies.find(c => c.id === id),

      createCompany: (company) => {
        const newCompany: Company = {
          ...company,
          id: `comp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ companies: [...state.companies, newCompany] }));
        return newCompany;
      },

      updateCompany: (id, updates) => {
        set(state => ({
          companies: state.companies.map(c => 
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteCompany: (id) => {
        set(state => ({
          companies: state.companies.filter(c => c.id !== id),
        }));
      },

      // Contacts
      getContacts: () => {
        const authStore = useAuthStore.getState();
        const user = authStore.user;
        if (!user) return [];
        
        if (user.roleId === "role-admin") return get().contacts;
        
        return get().contacts.filter(c => 
          user.companyScope.length === 0 || 
          (c.companyId && user.companyScope.includes(c.companyId))
        );
      },

      getContact: (id) => get().contacts.find(c => c.id === id),

      createContact: (contact) => {
        const newContact: Contact = {
          ...contact,
          id: `cont-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ contacts: [...state.contacts, newContact] }));
        return newContact;
      },

      updateContact: (id, updates) => {
        set(state => ({
          contacts: state.contacts.map(c => 
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteContact: (id) => {
        set(state => ({
          contacts: state.contacts.filter(c => c.id !== id),
        }));
      },

      // Users
      getUsers: () => get().users,
      getUser: (id) => get().users.find(u => u.id === id),

      createUser: (user) => {
        const newUser: User = {
          ...user,
          id: `user-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ users: [...state.users, newUser] }));
        return newUser;
      },

      updateUser: (id, updates) => {
        set(state => ({
          users: state.users.map(u => 
            u.id === id ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u
          ),
        }));
      },

      deleteUser: (id) => {
        set(state => ({
          users: state.users.map(u => 
            u.id === id ? { ...u, status: "inactive" as const } : u
          ),
        }));
      },

      // Roles
      getRoles: () => get().roles,
      getRole: (id) => get().roles.find(r => r.id === id),

      createRole: (role) => {
        const newRole: Role = {
          ...role,
          id: `role-${Date.now()}`,
        };
        set(state => ({ roles: [...state.roles, newRole] }));
        return newRole;
      },

      updateRole: (id, updates) => {
        set(state => ({
          roles: state.roles.map(r => 
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      deleteRole: (id) => {
        set(state => ({
          roles: state.roles.filter(r => r.id !== id),
        }));
      },

      // Configs
      getConfigs: () => get().configs,
      getConfig: (id) => get().configs.find(c => c.id === id),

      createConfig: (config) => {
        const newConfig: Config = {
          ...config,
          id: `config-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ configs: [...state.configs, newConfig] }));
        return newConfig;
      },

      updateConfig: (id, updates) => {
        set(state => ({
          configs: state.configs.map(c => 
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteConfig: (id) => {
        set(state => ({
          configs: state.configs.filter(c => c.id !== id),
        }));
      },

      // Generic table data
      getTableData: (tableId) => {
        const state = get();
        switch (tableId) {
          case "deals":
            return state.getDeals() as unknown as TableRow[];
          case "companies":
            return state.getCompanies() as unknown as TableRow[];
          case "contacts":
            return state.getContacts() as unknown as TableRow[];
          case "users":
            return state.getUsers() as unknown as TableRow[];
          case "roles":
            return state.getRoles() as unknown as TableRow[];
          case "configs":
            return state.getConfigs() as unknown as TableRow[];
          default:
            return [];
        }
      },

      updateRow: (tableId, rowId, updates) => {
        switch (tableId) {
          case "deals":
            get().updateDeal(rowId, updates as Partial<Deal>);
            break;
          case "companies":
            get().updateCompany(rowId, updates as Partial<Company>);
            break;
          case "contacts":
            get().updateContact(rowId, updates as Partial<Contact>);
            break;
          case "users":
            get().updateUser(rowId, updates as Partial<User>);
            break;
          case "roles":
            get().updateRole(rowId, updates as Partial<Role>);
            break;
          case "configs":
            get().updateConfig(rowId, updates as Partial<Config>);
            break;
        }
      },

      reseedData: () => {
        set({
          deals: mockDeals,
          companies: mockCompanies,
          contacts: mockContacts,
          users: mockUsers,
          roles: mockRoles,
          configs: mockConfigs,
        });
      },
    }),
    {
      name: "crm-data",
    }
  )
);

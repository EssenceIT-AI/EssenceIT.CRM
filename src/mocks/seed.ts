import { mockCompanies, mockContacts, mockDeals, mockRoles, mockUsers } from "./data";
import { allSchemas } from "./schemas";

const STORAGE_KEYS = {
  companies: "crm_companies",
  contacts: "crm_contacts",
  deals: "crm_deals",
  users: "crm_users",
  roles: "crm_roles",
  schemas: "crm_schemas",
  views: "crm_saved_views",
};

export const seedData = () => {
  // Initialize all data in localStorage
  localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(mockCompanies));
  localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(mockContacts));
  localStorage.setItem(STORAGE_KEYS.deals, JSON.stringify(mockDeals));
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(mockUsers));
  localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(mockRoles));
  localStorage.setItem(STORAGE_KEYS.schemas, JSON.stringify(allSchemas));
  localStorage.setItem(STORAGE_KEYS.views, JSON.stringify([]));
  
  console.log("✅ Mock data seeded successfully");
};

export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

export const saveToStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log("🗑️ All mock data cleared");
};

export const resetToDefaults = () => {
  clearAllData();
  seedData();
};

export { STORAGE_KEYS };

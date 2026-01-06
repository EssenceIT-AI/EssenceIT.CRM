import { appConfig } from "@/config/app.config";
import { Company } from "@/types";
import { useDataStore } from "@/stores";
import { httpClient } from "@/lib/httpClient";

interface CompaniesService {
  list: () => Promise<Company[]>;
  getById: (id: string) => Promise<Company | null>;
  create: (data: Omit<Company, "id" | "createdAt" | "updatedAt">) => Promise<Company>;
  update: (id: string, data: Partial<Company>) => Promise<Company | null>;
  delete: (id: string) => Promise<boolean>;
}

const mockCompaniesService: CompaniesService = {
  list: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return useDataStore.getState().getCompanies();
  },
  
  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return useDataStore.getState().getCompany(id) || null;
  },
  
  create: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return useDataStore.getState().createCompany(data);
  },
  
  update: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    useDataStore.getState().updateCompany(id, data);
    return useDataStore.getState().getCompany(id) || null;
  },
  
  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    useDataStore.getState().deleteCompany(id);
    return true;
  },
};

const apiCompaniesService: CompaniesService = {
  list: async () => {
    const response = await httpClient.get<Company[]>("/companies");
    return response.data || [];
  },
  
  getById: async (id) => {
    const response = await httpClient.get<Company>(`/companies/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await httpClient.post<Company>("/companies", data);
    if (!response.data) throw new Error(response.error || "Failed to create company");
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await httpClient.patch<Company>(`/companies/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await httpClient.delete(`/companies/${id}`);
    return response.status === 200 || response.status === 204;
  },
};

export const companiesService: CompaniesService = 
  appConfig.dataSource === "mock" ? mockCompaniesService : apiCompaniesService;

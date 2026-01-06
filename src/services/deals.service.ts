import { appConfig } from "@/config/app.config";
import { Deal } from "@/types";
import { useDataStore } from "@/stores";
import { httpClient } from "@/lib/httpClient";

interface DealsService {
  list: () => Promise<Deal[]>;
  getById: (id: string) => Promise<Deal | null>;
  create: (data: Omit<Deal, "id" | "createdAt">) => Promise<Deal>;
  update: (id: string, data: Partial<Deal>) => Promise<Deal | null>;
  delete: (id: string) => Promise<boolean>;
}

const mockDealsService: DealsService = {
  list: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return useDataStore.getState().getDeals();
  },
  
  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return useDataStore.getState().getDeal(id) || null;
  },
  
  create: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return useDataStore.getState().createDeal(data);
  },
  
  update: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    useDataStore.getState().updateDeal(id, data);
    return useDataStore.getState().getDeal(id) || null;
  },
  
  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    useDataStore.getState().deleteDeal(id);
    return true;
  },
};

const apiDealsService: DealsService = {
  list: async () => {
    const response = await httpClient.get<Deal[]>("/deals");
    return response.data || [];
  },
  
  getById: async (id) => {
    const response = await httpClient.get<Deal>(`/deals/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await httpClient.post<Deal>("/deals", data);
    if (!response.data) throw new Error(response.error || "Failed to create deal");
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await httpClient.patch<Deal>(`/deals/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await httpClient.delete(`/deals/${id}`);
    return response.status === 200 || response.status === 204;
  },
};

export const dealsService: DealsService = 
  appConfig.dataSource === "mock" ? mockDealsService : apiDealsService;

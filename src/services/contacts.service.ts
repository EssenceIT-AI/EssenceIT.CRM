import { appConfig } from "@/config/app.config";
import { Contact } from "@/types";
import { useDataStore } from "@/stores";
import { httpClient } from "@/lib/httpClient";

interface ContactsService {
  list: () => Promise<Contact[]>;
  getById: (id: string) => Promise<Contact | null>;
  create: (data: Omit<Contact, "id" | "createdAt" | "updatedAt">) => Promise<Contact>;
  update: (id: string, data: Partial<Contact>) => Promise<Contact | null>;
  delete: (id: string) => Promise<boolean>;
}

const mockContactsService: ContactsService = {
  list: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return useDataStore.getState().getContacts();
  },
  
  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return useDataStore.getState().getContact(id) || null;
  },
  
  create: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return useDataStore.getState().createContact(data);
  },
  
  update: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    useDataStore.getState().updateContact(id, data);
    return useDataStore.getState().getContact(id) || null;
  },
  
  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    useDataStore.getState().deleteContact(id);
    return true;
  },
};

const apiContactsService: ContactsService = {
  list: async () => {
    const response = await httpClient.get<Contact[]>("/contacts");
    return response.data || [];
  },
  
  getById: async (id) => {
    const response = await httpClient.get<Contact>(`/contacts/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await httpClient.post<Contact>("/contacts", data);
    if (!response.data) throw new Error(response.error || "Failed to create contact");
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await httpClient.patch<Contact>(`/contacts/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await httpClient.delete(`/contacts/${id}`);
    return response.status === 200 || response.status === 204;
  },
};

export const contactsService: ContactsService = 
  appConfig.dataSource === "mock" ? mockContactsService : apiContactsService;

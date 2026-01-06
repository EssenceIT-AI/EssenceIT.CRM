import { httpClient } from "@/lib/httpClient";

export interface Contact {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  position: string | null;
  owner_id: string | null;
  props: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  organization_id: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_id?: string | null;
  position?: string | null;
  owner_id?: string | null;
  props?: Record<string, unknown>;
}

export interface ContactPatch {
  first_name?: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_id?: string | null;
  position?: string | null;
  owner_id?: string | null;
  props?: Record<string, unknown>;
}

const parseContact = (data: any): Contact => ({
  id: data.id,
  organization_id: data.organization_id,
  first_name: data.first_name,
  last_name: data.last_name,
  email: data.email,
  phone: data.phone,
  company_id: data.company_id,
  position: data.position,
  owner_id: data.owner_id,
  props: (data.props as Record<string, unknown>) ?? {},
  created_at: data.created_at ?? new Date().toISOString(),
  updated_at: data.updated_at ?? new Date().toISOString(),
});

export const contactsRepo = {
  async list(orgId: string): Promise<Contact[]> {
    const response = await httpClient.get<Contact[]>("/contacts");
    if (response.error) {
      console.error("Error fetching contacts:", response.error);
      throw new Error(response.error);
    }
    return (response.data || []).map(parseContact);
  },

  async get(id: string): Promise<Contact | null> {
    const response = await httpClient.get<Contact>(`/contacts/${id}`);
    if (response.status === 404) return null;
    if (response.error) {
      console.error("Error fetching contact:", response.error);
      throw new Error(response.error);
    }
    return response.data ? parseContact(response.data) : null;
  },

  async create(createData: ContactCreate): Promise<Contact> {
    const response = await httpClient.post<Contact>("/contacts", {
      first_name: createData.first_name,
      last_name: createData.last_name ?? null,
      email: createData.email ?? null,
      phone: createData.phone ?? null,
      company_id: createData.company_id ?? null,
      position: createData.position ?? null,
      owner_id: createData.owner_id ?? null,
      props: createData.props ?? {},
    });
    if (!response.data) {
      console.error("Error creating contact:", response.error);
      throw new Error(response.error || "Failed to create contact");
    }
    return parseContact(response.data);
  },

  async update(id: string, patch: ContactPatch): Promise<Contact> {
    const updateData: Record<string, unknown> = {};
    if (patch.first_name !== undefined) updateData.first_name = patch.first_name;
    if (patch.last_name !== undefined) updateData.last_name = patch.last_name;
    if (patch.email !== undefined) updateData.email = patch.email;
    if (patch.phone !== undefined) updateData.phone = patch.phone;
    if (patch.company_id !== undefined) updateData.company_id = patch.company_id;
    if (patch.position !== undefined) updateData.position = patch.position;
    if (patch.owner_id !== undefined) updateData.owner_id = patch.owner_id;
    if (patch.props !== undefined) updateData.props = patch.props;

    const response = await httpClient.patch<Contact>(`/contacts/${id}`, updateData);
    if (!response.data) {
      console.error("Error updating contact:", response.error);
      throw new Error(response.error || "Failed to update contact");
    }
    return parseContact(response.data);
  },

  async delete(id: string): Promise<void> {
    const response = await httpClient.delete(`/contacts/${id}`);
    if (response.error) {
      console.error("Error deleting contact:", response.error);
      throw new Error(response.error);
    }
  },
};

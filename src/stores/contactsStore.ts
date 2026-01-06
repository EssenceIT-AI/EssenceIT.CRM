import { create } from "zustand";
import { contactsRepo, Contact, ContactCreate, ContactPatch } from "@/data/contactsRepo";

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  lastOrgId: string | null;

  // Actions
  loadContacts: (orgId: string) => Promise<void>;
  getContact: (id: string) => Contact | undefined;
  createContact: (orgId: string, data: Omit<ContactCreate, 'organization_id'>) => Promise<Contact>;
  updateContact: (id: string, patch: ContactPatch) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;
  reset: () => void;

  // Table compatibility
  asTableRows: () => Record<string, unknown>[];
}

export const useContactsStore = create<ContactsState>()((set, get) => ({
  contacts: [],
  loading: false,
  error: null,
  lastOrgId: null,

  loadContacts: async (orgId: string) => {
    // Skip if already loaded for this org
    if (get().lastOrgId === orgId && get().contacts.length > 0) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const contacts = await contactsRepo.list(orgId);
      set({ contacts, loading: false, lastOrgId: orgId });
    } catch (error) {
      console.error("Error loading contacts:", error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  getContact: (id: string) => {
    return get().contacts.find((c) => c.id === id);
  },

  createContact: async (orgId: string, data) => {
    const contact = await contactsRepo.create({
      ...data,
      organization_id: orgId,
    });

    set((state) => ({
      contacts: [contact, ...state.contacts],
    }));

    return contact;
  },

  updateContact: async (id: string, patch: ContactPatch) => {
    // Optimistic update
    const previousContacts = get().contacts;
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, ...patch, updated_at: new Date().toISOString() } : c
      ),
    }));

    try {
      const updated = await contactsRepo.update(id, patch);
      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === id ? updated : c)),
      }));
      return updated;
    } catch (error) {
      // Rollback on error
      set({ contacts: previousContacts });
      throw error;
    }
  },

  deleteContact: async (id: string) => {
    const previousContacts = get().contacts;
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    }));

    try {
      await contactsRepo.delete(id);
    } catch (error) {
      set({ contacts: previousContacts });
      throw error;
    }
  },

  reset: () => {
    set({ contacts: [], loading: false, error: null, lastOrgId: null });
  },

  asTableRows: () => {
    return get().contacts.map((c) => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
      phone: c.phone,
      companyId: c.company_id,
      position: c.position,
      ownerId: c.owner_id,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      ...c.props,
    }));
  },
}));

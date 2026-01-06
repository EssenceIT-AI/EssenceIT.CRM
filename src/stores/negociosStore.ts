import { create } from "zustand";
import { negociosRepo, Negocio, NegocioCreate, NegocioPatch } from "@/data/negociosRepo";
import { schemaRepo, NegociosSchema } from "@/data/schemaRepo";
import { ColumnDefinition, TableRow } from "@/types";

interface NegociosState {
  negocios: Negocio[];
  schema: NegociosSchema | null;
  loading: boolean;
  schemaLoading: boolean;
  currentOrgId: string | null;
  
  // Data actions
  loadNegocios: (orgId: string) => Promise<void>;
  getNegocio: (id: string) => Negocio | undefined;
  createNegocio: (data: Omit<NegocioCreate, "organization_id">) => Promise<Negocio>;
  updateNegocio: (id: string, patch: NegocioPatch) => Promise<void>;
  deleteNegocio: (id: string) => Promise<void>;
  
  // Schema actions
  loadSchema: (orgId: string) => Promise<void>;
  updateSchema: (columns: ColumnDefinition[]) => Promise<void>;
  
  // Helpers
  asTableRows: () => TableRow[];
  reset: () => void;
}

export const useNegociosStore = create<NegociosState>()((set, get) => ({
  negocios: [],
  schema: null,
  loading: false,
  schemaLoading: false,
  currentOrgId: null,

  loadNegocios: async (orgId: string) => {
    set({ loading: true, currentOrgId: orgId });
    
    try {
      const data = await negociosRepo.list(orgId);
      set({ negocios: data, loading: false });
    } catch (error) {
      console.error("Failed to load negocios:", error);
      set({ loading: false });
    }
  },

  getNegocio: (id: string) => {
    return get().negocios.find(n => n.id === id);
  },

  createNegocio: async (data) => {
    const orgId = get().currentOrgId;
    if (!orgId) throw new Error("No organization selected");

    const negocio = await negociosRepo.create({
      ...data,
      organization_id: orgId,
    });

    set(state => ({
      negocios: [negocio, ...state.negocios],
    }));

    return negocio;
  },

  updateNegocio: async (id: string, patch: NegocioPatch) => {
    // Optimistic update
    const previousNegocios = get().negocios;
    
    set(state => ({
      negocios: state.negocios.map(n =>
        n.id === id ? { ...n, ...patch } : n
      ),
    }));

    try {
      await negociosRepo.update(id, patch);
    } catch (error) {
      // Rollback on error
      set({ negocios: previousNegocios });
      throw error;
    }
  },

  deleteNegocio: async (id: string) => {
    const previousNegocios = get().negocios;
    
    set(state => ({
      negocios: state.negocios.filter(n => n.id !== id),
    }));

    try {
      await negociosRepo.delete(id);
    } catch (error) {
      set({ negocios: previousNegocios });
      throw error;
    }
  },

  loadSchema: async (orgId: string) => {
    set({ schemaLoading: true });
    
    try {
      const schema = await schemaRepo.ensureSchema(orgId);
      set({ schema, schemaLoading: false });
    } catch (error) {
      console.error("Failed to load schema:", error);
      set({ schemaLoading: false });
    }
  },

  updateSchema: async (columns: ColumnDefinition[]) => {
    const orgId = get().currentOrgId;
    if (!orgId) throw new Error("No organization selected");

    const previousSchema = get().schema;
    
    // Optimistic update
    set(state => ({
      schema: state.schema ? { ...state.schema, columns } : null,
    }));

    try {
      await schemaRepo.upsertSchema(orgId, columns);
    } catch (error) {
      set({ schema: previousSchema });
      throw error;
    }
  },

  asTableRows: () => {
    const { negocios, schema } = get();
    
    return negocios.map(n => {
      const row: TableRow = {
        id: n.id,
        name: n.title,
        value: n.value,
        ownerId: n.owner_id,
        createdAt: n.created_at,
        ...n.props,
      };
      return row;
    });
  },

  reset: () => {
    set({
      negocios: [],
      schema: null,
      loading: false,
      schemaLoading: false,
      currentOrgId: null,
    });
  },
}));

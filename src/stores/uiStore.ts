import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  globalSearchOpen: boolean;
  activeCompanyId: string | null;
  theme: "light" | "dark";
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleGlobalSearch: () => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setActiveCompany: (companyId: string | null) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  globalSearchOpen: false,
  activeCompanyId: null,
  theme: "dark",

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleGlobalSearch: () => set((state) => ({ globalSearchOpen: !state.globalSearchOpen })),
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  setActiveCompany: (companyId) => set({ activeCompanyId: companyId }),
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === "dark" ? "light" : "dark" 
  })),
}));

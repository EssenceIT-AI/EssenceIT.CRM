import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthTokens, Role } from "@/types";
import { Permission } from "@/config/app.config";
import { mockCredentials, mockRoles, mockUsers } from "@/mocks/data";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  getUserRole: () => Role | null;
  isTokenExpired: () => boolean;
}

const generateMockToken = () => {
  return `jwt.mock.${Date.now()}.${Math.random().toString(36).substring(7)}`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const storedPassword = mockCredentials[email];
        
        if (!storedPassword || storedPassword !== password) {
          set({ isLoading: false });
          return { success: false, error: "Credenciais inválidas" };
        }
        
        const user = mockUsers.find(u => u.email === email);
        
        if (!user) {
          set({ isLoading: false });
          return { success: false, error: "Usuário não encontrado" };
        }
        
        if (user.status !== "active") {
          set({ isLoading: false });
          return { success: false, error: "Usuário inativo" };
        }
        
        const tokens: AuthTokens = {
          accessToken: generateMockToken(),
          refreshToken: generateMockToken(),
          expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
        };
        
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
        });
        
        return { success: true };
      },

      register: async (data) => {
        set({ isLoading: true });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const existingUser = mockUsers.find(u => u.email === data.email);
        if (existingUser) {
          set({ isLoading: false });
          return { success: false, error: "Email já cadastrado" };
        }
        
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: data.email || "",
          name: data.name || "",
          roleId: "role-viewer",
          companyScope: [],
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // In a real app, this would save to backend
        mockUsers.push(newUser);
        mockCredentials[newUser.email] = data.password || "";
        
        const tokens: AuthTokens = {
          accessToken: generateMockToken(),
          refreshToken: generateMockToken(),
          expiresAt: Date.now() + 15 * 60 * 1000,
        };
        
        set({
          user: newUser,
          tokens,
          isAuthenticated: true,
          isLoading: false,
        });
        
        return { success: true };
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        });
      },

      refreshToken: async () => {
        const { tokens } = get();
        
        if (!tokens?.refreshToken) {
          return false;
        }
        
        // Simulate token refresh
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const newTokens: AuthTokens = {
          accessToken: generateMockToken(),
          refreshToken: generateMockToken(),
          expiresAt: Date.now() + 15 * 60 * 1000,
        };
        
        set({ tokens: newTokens });
        return true;
      },

      updateProfile: (data) => {
        const { user } = get();
        if (!user) return;
        
        const updatedUser = {
          ...user,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        
        set({ user: updatedUser });
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        
        const role = mockRoles.find(r => r.id === user.roleId);
        if (!role) return false;
        
        return role.permissions.includes(permission);
      },

      hasAnyPermission: (permissions) => {
        const { hasPermission } = get();
        return permissions.some(p => hasPermission(p));
      },

      getUserRole: () => {
        const { user } = get();
        if (!user) return null;
        
        return mockRoles.find(r => r.id === user.roleId) || null;
      },

      isTokenExpired: () => {
        const { tokens } = get();
        if (!tokens) return true;
        return Date.now() >= tokens.expiresAt;
      },
    }),
    {
      name: "crm-auth",
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

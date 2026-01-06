export const appConfig = {
  dataSource: (import.meta.env.VITE_DATA_SOURCE ?? "mock") as "mock" | "api",
  authMode: (import.meta.env.VITE_AUTH_MODE ?? "mock") as "mock" | "jwt",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  tokenExpirationMinutes: 15,
  refreshTokenExpirationDays: 7,
} as const;

export const permissions = {
  // Deals
  "deals:view": "Visualizar negócios",
  "deals:create": "Criar negócios",
  "deals:edit": "Editar negócios",
  "deals:delete": "Excluir negócios",
  
  // Kanban
  "kanban:view": "Visualizar kanban",
  "kanban:edit": "Editar kanban",
  
  // Companies
  "companies:view": "Visualizar empresas",
  "companies:create": "Criar empresas",
  "companies:edit": "Editar empresas",
  "companies:delete": "Excluir empresas",
  
  // Contacts
  "contacts:view": "Visualizar contatos",
  "contacts:create": "Criar contatos",
  "contacts:edit": "Editar contatos",
  "contacts:delete": "Excluir contatos",
  
  // Dashboards
  "dashboard:view": "Visualizar dashboards",
  "dashboard:clevel": "Dashboard C-Level",
  "dashboard:marketing": "Dashboard Marketing",
  
  // Admin
  "admin:users": "Gerenciar usuários",
  "admin:roles": "Gerenciar perfis",
  "admin:settings": "Configurações do sistema",
} as const;

export type Permission = keyof typeof permissions;

export const defaultRoles = {
  admin: {
    id: "role-admin",
    name: "Administrador",
    description: "Acesso total ao sistema",
    permissions: Object.keys(permissions) as Permission[],
  },
  sales: {
    id: "role-sales",
    name: "Vendas",
    description: "Acesso às funcionalidades de vendas",
    permissions: [
      "deals:view",
      "deals:create",
      "deals:edit",
      "kanban:view",
      "kanban:edit",
      "companies:view",
      "contacts:view",
      "contacts:create",
      "contacts:edit",
      "dashboard:clevel",
    ] as Permission[],
  },
  marketing: {
    id: "role-marketing",
    name: "Marketing",
    description: "Acesso às funcionalidades de marketing",
    permissions: [
      "deals:view",
      "companies:view",
      "contacts:view",
      "dashboard:marketing",
    ] as Permission[],
  },
  viewer: {
    id: "role-viewer",
    name: "Visualizador",
    description: "Apenas visualização",
    permissions: [
      "deals:view",
      "kanban:view",
      "companies:view",
      "contacts:view",
    ] as Permission[],
  },
} as const;

import { Company, Contact, Deal, Role, User } from "@/types";
import { defaultRoles } from "@/config/app.config";
import { Config } from "@/stores/dataStore";

// Seed function for deterministic data generation
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Companies mock data
export const mockCompanies: Company[] = [
  { id: "comp-1", name: "Tech Solutions Ltda", domain: "techsolutions.com.br", industry: "technology", size: "medium", country: "Brasil", city: "São Paulo", ownerId: "user-1", createdAt: "2024-01-15T10:00:00Z", updatedAt: "2024-01-15T10:00:00Z" },
  { id: "comp-2", name: "Banco Digital S.A.", domain: "bancodigital.com.br", industry: "finance", size: "large", country: "Brasil", city: "Rio de Janeiro", ownerId: "user-2", createdAt: "2024-02-01T09:00:00Z", updatedAt: "2024-02-01T09:00:00Z" },
  { id: "comp-3", name: "Saúde Integral", domain: "saudeintegral.com.br", industry: "healthcare", size: "small", country: "Brasil", city: "Belo Horizonte", ownerId: "user-1", createdAt: "2024-02-15T14:00:00Z", updatedAt: "2024-02-15T14:00:00Z" },
  { id: "comp-4", name: "Varejo Express", domain: "varejoexpress.com.br", industry: "retail", size: "enterprise", country: "Brasil", city: "São Paulo", ownerId: "user-2", createdAt: "2024-03-01T11:00:00Z", updatedAt: "2024-03-01T11:00:00Z" },
  { id: "comp-5", name: "Indústria Forte", domain: "industriaforte.com.br", industry: "manufacturing", size: "large", country: "Brasil", city: "Curitiba", ownerId: "user-1", createdAt: "2024-03-10T08:00:00Z", updatedAt: "2024-03-10T08:00:00Z" },
  { id: "comp-6", name: "Consultoria Premium", domain: "consultoriapremium.com.br", industry: "services", size: "small", country: "Brasil", city: "Porto Alegre", ownerId: "user-2", createdAt: "2024-03-20T16:00:00Z", updatedAt: "2024-03-20T16:00:00Z" },
  { id: "comp-7", name: "StartupX", domain: "startupx.io", industry: "technology", size: "micro", country: "Brasil", city: "Florianópolis", ownerId: "user-1", createdAt: "2024-04-01T10:00:00Z", updatedAt: "2024-04-01T10:00:00Z" },
  { id: "comp-8", name: "Logística Total", domain: "logisticatotal.com.br", industry: "services", size: "medium", country: "Brasil", city: "Campinas", ownerId: "user-2", createdAt: "2024-04-15T13:00:00Z", updatedAt: "2024-04-15T13:00:00Z" },
];

// Contacts mock data
export const mockContacts: Contact[] = [
  { id: "cont-1", firstName: "Carlos", lastName: "Silva", email: "carlos.silva@techsolutions.com.br", phone: "(11) 99999-1111", companyId: "comp-1", position: "CTO", ownerId: "user-1", createdAt: "2024-01-15T10:00:00Z", updatedAt: "2024-01-15T10:00:00Z" },
  { id: "cont-2", firstName: "Maria", lastName: "Santos", email: "maria.santos@bancodigital.com.br", phone: "(21) 99999-2222", companyId: "comp-2", position: "CFO", ownerId: "user-2", createdAt: "2024-02-01T09:00:00Z", updatedAt: "2024-02-01T09:00:00Z" },
  { id: "cont-3", firstName: "João", lastName: "Oliveira", email: "joao.oliveira@saudeintegral.com.br", phone: "(31) 99999-3333", companyId: "comp-3", position: "CEO", ownerId: "user-1", createdAt: "2024-02-15T14:00:00Z", updatedAt: "2024-02-15T14:00:00Z" },
  { id: "cont-4", firstName: "Ana", lastName: "Costa", email: "ana.costa@varejoexpress.com.br", phone: "(11) 99999-4444", companyId: "comp-4", position: "Diretora de TI", ownerId: "user-2", createdAt: "2024-03-01T11:00:00Z", updatedAt: "2024-03-01T11:00:00Z" },
  { id: "cont-5", firstName: "Pedro", lastName: "Ferreira", email: "pedro.ferreira@industriaforte.com.br", phone: "(41) 99999-5555", companyId: "comp-5", position: "Gerente de Operações", ownerId: "user-1", createdAt: "2024-03-10T08:00:00Z", updatedAt: "2024-03-10T08:00:00Z" },
  { id: "cont-6", firstName: "Lucia", lastName: "Mendes", email: "lucia.mendes@consultoriapremium.com.br", phone: "(51) 99999-6666", companyId: "comp-6", position: "Sócia", ownerId: "user-2", createdAt: "2024-03-20T16:00:00Z", updatedAt: "2024-03-20T16:00:00Z" },
  { id: "cont-7", firstName: "Rafael", lastName: "Lima", email: "rafael.lima@startupx.io", phone: "(48) 99999-7777", companyId: "comp-7", position: "Founder", ownerId: "user-1", createdAt: "2024-04-01T10:00:00Z", updatedAt: "2024-04-01T10:00:00Z" },
  { id: "cont-8", firstName: "Fernanda", lastName: "Rocha", email: "fernanda.rocha@logisticatotal.com.br", phone: "(19) 99999-8888", companyId: "comp-8", position: "Diretora Comercial", ownerId: "user-2", createdAt: "2024-04-15T13:00:00Z", updatedAt: "2024-04-15T13:00:00Z" },
];

// Deals mock data with varied stages and values
export const mockDeals: Deal[] = [
  { id: "deal-1", name: "Implementação ERP", companyId: "comp-1", contactId: "cont-1", product: "VAR", origin: "inbound", stage: "negotiation", ownerId: "user-1", value: 150000, createdAt: "2024-10-01T10:00:00Z", expectedCloseDate: "2024-12-30T10:00:00Z" },
  { id: "deal-2", name: "Migração Cloud", companyId: "comp-2", contactId: "cont-2", product: "COM", origin: "outbound", stage: "proposal", ownerId: "user-2", value: 280000, createdAt: "2024-10-15T09:00:00Z", expectedCloseDate: "2025-01-15T09:00:00Z" },
  { id: "deal-3", name: "Sistema de Gestão Hospitalar", companyId: "comp-3", contactId: "cont-3", product: "AMS", origin: "referral", stage: "qualification", ownerId: "user-1", value: 95000, createdAt: "2024-11-01T14:00:00Z", expectedCloseDate: "2025-02-01T14:00:00Z" },
  { id: "deal-4", name: "E-commerce Platform", companyId: "comp-4", contactId: "cont-4", product: "COM", origin: "marketing", stage: "closing", ownerId: "user-2", value: 420000, createdAt: "2024-09-01T11:00:00Z", expectedCloseDate: "2024-12-20T11:00:00Z" },
  { id: "deal-5", name: "IoT Factory Solution", companyId: "comp-5", contactId: "cont-5", product: "VAR", origin: "partner", stage: "prospecting", ownerId: "user-1", value: 350000, createdAt: "2024-11-15T08:00:00Z", expectedCloseDate: "2025-03-15T08:00:00Z" },
  { id: "deal-6", name: "Business Intelligence Suite", companyId: "comp-6", contactId: "cont-6", product: "AMS", origin: "event", stage: "won", ownerId: "user-2", value: 78000, createdAt: "2024-08-01T16:00:00Z", expectedCloseDate: "2024-11-01T16:00:00Z", closedAt: "2024-10-28T16:00:00Z" },
  { id: "deal-7", name: "MVP Development", companyId: "comp-7", contactId: "cont-7", product: "COM", origin: "inbound", stage: "qualification", ownerId: "user-1", value: 65000, createdAt: "2024-11-20T10:00:00Z", expectedCloseDate: "2025-01-20T10:00:00Z" },
  { id: "deal-8", name: "Fleet Management System", companyId: "comp-8", contactId: "cont-8", product: "VAR", origin: "outbound", stage: "proposal", ownerId: "user-2", value: 185000, createdAt: "2024-10-20T13:00:00Z", expectedCloseDate: "2025-01-05T13:00:00Z" },
  { id: "deal-9", name: "CRM Customization", companyId: "comp-1", contactId: "cont-1", product: "AMS", origin: "referral", stage: "negotiation", ownerId: "user-1", value: 45000, createdAt: "2024-11-01T09:00:00Z", expectedCloseDate: "2024-12-28T09:00:00Z" },
  { id: "deal-10", name: "Banking App Modernization", companyId: "comp-2", contactId: "cont-2", product: "COM", origin: "inbound", stage: "closing", ownerId: "user-2", value: 520000, createdAt: "2024-09-15T14:00:00Z", expectedCloseDate: "2024-12-22T14:00:00Z" },
  { id: "deal-11", name: "Telemedicine Platform", companyId: "comp-3", contactId: "cont-3", product: "VAR", origin: "marketing", stage: "lost", ownerId: "user-1", value: 120000, createdAt: "2024-07-01T11:00:00Z", expectedCloseDate: "2024-10-01T11:00:00Z", closedAt: "2024-09-25T11:00:00Z" },
  { id: "deal-12", name: "Omnichannel Integration", companyId: "comp-4", contactId: "cont-4", product: "AMS", origin: "partner", stage: "proposal", ownerId: "user-2", value: 195000, createdAt: "2024-11-05T16:00:00Z", expectedCloseDate: "2025-02-05T16:00:00Z" },
];

// Users mock data
export const mockUsers: User[] = [
  { id: "user-1", email: "admin@crm.com", name: "Admin Sistema", avatar: undefined, roleId: "role-admin", companyScope: ["comp-1", "comp-2", "comp-3", "comp-4", "comp-5", "comp-6", "comp-7", "comp-8"], status: "active", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "user-2", email: "vendedor@crm.com", name: "João Vendedor", avatar: undefined, roleId: "role-sales", companyScope: ["comp-1", "comp-2", "comp-3", "comp-4"], status: "active", createdAt: "2024-01-15T00:00:00Z", updatedAt: "2024-01-15T00:00:00Z" },
  { id: "user-3", email: "marketing@crm.com", name: "Maria Marketing", avatar: undefined, roleId: "role-marketing", companyScope: ["comp-1", "comp-2"], status: "active", createdAt: "2024-02-01T00:00:00Z", updatedAt: "2024-02-01T00:00:00Z" },
  { id: "user-4", email: "viewer@crm.com", name: "Pedro Visualizador", avatar: undefined, roleId: "role-viewer", companyScope: ["comp-1"], status: "active", createdAt: "2024-03-01T00:00:00Z", updatedAt: "2024-03-01T00:00:00Z" },
];

// Roles mock data
export const mockRoles: Role[] = Object.values(defaultRoles);

// Configs mock data
export const mockConfigs: Config[] = [
  { id: "config-1", key: "meta_mensal_vendas", value: "500000", category: "metas", description: "Meta mensal de vendas em R$", createdAt: "2024-01-01T00:00:00Z" },
  { id: "config-2", key: "ciclo_medio_dias", value: "45", category: "metas", description: "Ciclo médio esperado em dias", createdAt: "2024-01-01T00:00:00Z" },
  { id: "config-3", key: "etapa_inicial_padrao", value: "prospecting", category: "etapas", description: "Etapa inicial padrão para novos negócios", createdAt: "2024-01-01T00:00:00Z" },
  { id: "config-4", key: "notificacoes_email", value: "true", category: "sistema", description: "Habilitar notificações por email", createdAt: "2024-01-01T00:00:00Z" },
  { id: "config-5", key: "moeda_padrao", value: "BRL", category: "geral", description: "Moeda padrão do sistema", createdAt: "2024-01-01T00:00:00Z" },
];

// Login credentials for mock auth
export const mockCredentials: Record<string, string> = {
  "admin@crm.com": "admin123",
  "vendedor@crm.com": "vendas123",
  "marketing@crm.com": "mkt123",
  "viewer@crm.com": "view123",
};

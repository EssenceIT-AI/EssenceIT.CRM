import { ColumnDefinition, KanbanStage, TableSchema } from "@/types";
import { permissions, Permission } from "@/config/app.config";

export const dealStages: KanbanStage[] = [
  { id: "prospecting", name: "Prospecção", color: "#64748b", order: 0, probability: 10 },
  { id: "qualification", name: "Qualificação", color: "#3b82f6", order: 1, probability: 20 },
  { id: "proposal", name: "Proposta", color: "#8b5cf6", order: 2, probability: 40 },
  { id: "negotiation", name: "Negociação", color: "#f59e0b", order: 3, probability: 60 },
  { id: "closing", name: "Fechamento", color: "#10b981", order: 4, probability: 80 },
  { id: "won", name: "Ganho", color: "#22c55e", order: 5, probability: 100 },
  { id: "lost", name: "Perdido", color: "#ef4444", order: 6, probability: 0 },
];

export const dealOrigins = [
  { value: "inbound", label: "Inbound", color: "#3b82f6" },
  { value: "outbound", label: "Outbound", color: "#8b5cf6" },
  { value: "referral", label: "Indicação", color: "#10b981" },
  { value: "partner", label: "Parceiro", color: "#f59e0b" },
  { value: "event", label: "Evento", color: "#ec4899" },
  { value: "marketing", label: "Marketing", color: "#06b6d4" },
];

export const productOptions = [
  { value: "VAR", label: "VAR", color: "#3b82f6" },
  { value: "COM", label: "COM", color: "#8b5cf6" },
  { value: "AMS", label: "AMS", color: "#10b981" },
];

export const statusOptions = [
  { value: "active", label: "Ativo", color: "#22c55e" },
  { value: "inactive", label: "Inativo", color: "#ef4444" },
];

export const configCategoryOptions = [
  { value: "geral", label: "Geral" },
  { value: "metas", label: "Metas" },
  { value: "etapas", label: "Etapas" },
  { value: "sistema", label: "Sistema" },
];

export const dealsSchema: TableSchema = {
  id: "deals",
  name: "Negócios",
  columns: [
    { id: "name", name: "Nome do Negócio", type: "text", visible: true, order: 0, required: true, editable: true },
    { id: "companyId", name: "Empresa", type: "relation", visible: true, order: 1, relationTable: "companies", editable: true },
    { id: "product", name: "Produto", type: "select", visible: true, order: 2, options: productOptions, editable: true },
    { id: "origin", name: "Origem", type: "select", visible: true, order: 3, options: dealOrigins, editable: true },
    { id: "stage", name: "Etapa", type: "select", visible: true, order: 4, options: dealStages.map(s => ({ value: s.id, label: s.name, color: s.color })), editable: true },
    { id: "ownerId", name: "Proprietário", type: "relation", visible: true, order: 5, relationTable: "users", editable: true },
    { id: "value", name: "Valor", type: "currency", visible: true, order: 6, editable: true },
    { id: "createdAt", name: "Data Criação", type: "date", visible: true, order: 7, editable: false },
    { id: "expectedCloseDate", name: "Data Prevista", type: "date", visible: true, order: 8, editable: true },
    { id: "contactId", name: "Contato", type: "relation", visible: false, order: 9, relationTable: "contacts", editable: true },
    { id: "notes", name: "Notas", type: "text", visible: false, order: 10, editable: true },
  ],
};

export const companiesSchema: TableSchema = {
  id: "companies",
  name: "Empresas",
  columns: [
    { id: "name", name: "Nome", type: "text", visible: true, order: 0, required: true, editable: true },
    { id: "domain", name: "Domínio", type: "text", visible: true, order: 1, editable: true },
    { id: "industry", name: "Segmento", type: "select", visible: true, order: 2, options: [
      { value: "technology", label: "Tecnologia" },
      { value: "finance", label: "Financeiro" },
      { value: "healthcare", label: "Saúde" },
      { value: "retail", label: "Varejo" },
      { value: "manufacturing", label: "Manufatura" },
      { value: "services", label: "Serviços" },
      { value: "other", label: "Outro" },
    ], editable: true },
    { id: "size", name: "Porte", type: "select", visible: true, order: 3, options: [
      { value: "micro", label: "Micro (1-9)" },
      { value: "small", label: "Pequena (10-49)" },
      { value: "medium", label: "Média (50-249)" },
      { value: "large", label: "Grande (250+)" },
      { value: "enterprise", label: "Enterprise (1000+)" },
    ], editable: true },
    { id: "country", name: "País", type: "text", visible: true, order: 4, editable: true },
    { id: "city", name: "Cidade", type: "text", visible: true, order: 5, editable: true },
    { id: "ownerId", name: "Proprietário", type: "relation", visible: true, order: 6, relationTable: "users", editable: true },
    { id: "createdAt", name: "Data Criação", type: "date", visible: false, order: 7, editable: false },
  ],
};

export const contactsSchema: TableSchema = {
  id: "contacts",
  name: "Contatos",
  columns: [
    { id: "firstName", name: "Nome", type: "text", visible: true, order: 0, required: true, editable: true },
    { id: "lastName", name: "Sobrenome", type: "text", visible: true, order: 1, editable: true },
    { id: "email", name: "Email", type: "text", visible: true, order: 2, required: true, editable: true },
    { id: "phone", name: "Telefone", type: "text", visible: true, order: 3, editable: true },
    { id: "companyId", name: "Empresa", type: "relation", visible: true, order: 4, relationTable: "companies", editable: true },
    { id: "position", name: "Cargo", type: "text", visible: true, order: 5, editable: true },
    { id: "ownerId", name: "Proprietário", type: "relation", visible: true, order: 6, relationTable: "users", editable: true },
    { id: "createdAt", name: "Data Criação", type: "date", visible: false, order: 7, editable: false },
  ],
};

export const usersSchema: TableSchema = {
  id: "users",
  name: "Usuários",
  columns: [
    { id: "name", name: "Nome", type: "text", visible: true, order: 0, required: true, editable: true },
    { id: "email", name: "Email", type: "text", visible: true, order: 1, required: true, editable: true },
    { id: "roleId", name: "Perfil", type: "relation", visible: true, order: 2, relationTable: "roles", editable: true },
    { id: "status", name: "Status", type: "select", visible: true, order: 3, options: statusOptions, editable: true },
    { id: "companyScope", name: "Empresas", type: "multi-select", visible: true, order: 4, editable: false, description: "Empresas vinculadas ao usuário" },
    { id: "createdAt", name: "Data Criação", type: "date", visible: false, order: 5, editable: false },
  ],
};

export const rolesSchema: TableSchema = {
  id: "roles",
  name: "Perfis de Acesso",
  columns: [
    { id: "name", name: "Nome", type: "text", visible: true, order: 0, required: true, editable: true },
    { id: "description", name: "Descrição", type: "text", visible: true, order: 1, editable: true },
    { id: "permissions", name: "Permissões", type: "multi-select", visible: true, order: 2, options: Object.entries(permissions).map(([key, label]) => ({ value: key, label })), editable: false },
  ],
};

export const configsSchema: TableSchema = {
  id: "configs",
  name: "Configurações",
  columns: [
    { id: "key", name: "Chave", type: "text", visible: true, order: 0, required: true, editable: true },
    { id: "value", name: "Valor", type: "text", visible: true, order: 1, required: true, editable: true },
    { id: "category", name: "Categoria", type: "select", visible: true, order: 2, options: configCategoryOptions, editable: true },
    { id: "description", name: "Descrição", type: "text", visible: true, order: 3, editable: true },
    { id: "createdAt", name: "Data Criação", type: "date", visible: false, order: 4, editable: false },
  ],
};

export const allSchemas: Record<string, TableSchema> = {
  deals: dealsSchema,
  companies: companiesSchema,
  contacts: contactsSchema,
  users: usersSchema,
  roles: rolesSchema,
  configs: configsSchema,
};

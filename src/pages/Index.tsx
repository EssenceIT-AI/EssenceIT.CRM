import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore, useNegociosStore, useCompaniesStore, useContactsStore } from "@/stores";
import { useOrganizationStore } from "@/stores/organizationStore";
import { Target, Kanban, Building2, Users, BarChart3, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const QuickLink = ({ to, icon: Icon, label, description, color }: { to: string; icon: React.ElementType; label: string; description: string; color: string }) => (
  <Link
    to={to}
    className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-glow transition-all duration-300"
  >
    <div className="flex items-start gap-4">
      <div className={cn("p-3 rounded-lg", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{label}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  </Link>
);

const Index = () => {
  const { user, getUserRole } = useAuthStore();
  const { activeOrganizationId } = useOrganizationStore();
  const { negocios, loading: loadingNegocios, loadNegocios } = useNegociosStore();
  const { companies, loading: loadingCompanies, loadCompanies } = useCompaniesStore();
  const { contacts, loading: loadingContacts, loadContacts } = useContactsStore();
  
  const role = getUserRole();

  // Load all data when org changes
  useEffect(() => {
    if (activeOrganizationId) {
      loadNegocios(activeOrganizationId);
      loadCompanies(activeOrganizationId);
      loadContacts(activeOrganizationId);
    }
  }, [activeOrganizationId, loadNegocios, loadCompanies, loadContacts]);

  const loading = loadingNegocios || loadingCompanies || loadingContacts;

  // Calculate metrics from negocios
  const pipelineValue = negocios
    .filter(n => {
      const stage = (n.props?.stage as string) || "";
      return !["won", "lost"].includes(stage);
    })
    .reduce((sum, n) => sum + (n.value || 0), 0);
    
  const wonValue = negocios
    .filter(n => (n.props?.stage as string) === "won")
    .reduce((sum, n) => sum + (n.value || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {role?.name} • Bem-vindo ao CRM Hub
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Pipeline Ativo", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pipelineValue), color: "text-primary" },
          { label: "Negócios Ganhos", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(wonValue), color: "text-success" },
          { label: "Empresas", value: companies.length, color: "text-info" },
          { label: "Contatos", value: contacts.length, color: "text-warning" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border border-border bg-card">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickLink to="/negocios" icon={Target} label="Negócios" description="Gerencie oportunidades de vendas" color="bg-primary/10 text-primary" />
          <QuickLink to="/kanban" icon={Kanban} label="Kanban" description="Visualize o pipeline" color="bg-info/10 text-info" />
          <QuickLink to="/empresas" icon={Building2} label="Empresas" description="Base de clientes" color="bg-success/10 text-success" />
          <QuickLink to="/contatos" icon={Users} label="Contatos" description="Pessoas de contato" color="bg-warning/10 text-warning" />
          <QuickLink to="/dashboards/c-level" icon={BarChart3} label="Dashboard C-Level" description="Métricas executivas" color="bg-destructive/10 text-destructive" />
          <QuickLink to="/dashboards/marketing" icon={TrendingUp} label="Dashboard Marketing" description="Performance de marketing" color="bg-accent/10 text-accent" />
        </div>
      </div>
    </div>
  );
};

export default Index;
